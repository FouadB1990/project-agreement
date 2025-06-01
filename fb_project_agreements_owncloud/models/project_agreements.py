import logging
import requests
from datetime import timedelta
from requests.auth import HTTPBasicAuth
from odoo import api, fields, models, _
from odoo.exceptions import UserError
import base64


_logger = logging.getLogger(__name__)

class ProjectAgreements(models.Model):
    _name = "project.agreements"
    _description = "Project Agreements"
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = "name, id"

    name = fields.Char(string='Agreement Name', required=True, copy=False, readonly=True, index=True, default=lambda self: _('New'))
    reference = fields.Char(string='Reference Number')
    project_ids = fields.One2many('project.project', 'agreement_id', string='Projects')
    company_id = fields.Many2one('res.company', 'Company', required=True, default=lambda self: self.env.company)
    sale_order_id = fields.Many2one('sale.order', 'Sale Order', required=False)
    date_start = fields.Date(string='Start Date', required=True, default=fields.Date.context_today)
    date_end = fields.Date(string='End Date', required=True, default=lambda self: fields.Date.today() + timedelta(days=365))
    responsible_id = fields.Many2one('res.users', string='Responsible User', required=True, default=lambda self: self.env.user)
    note = fields.Text(string='Notes')
    attachment_ids = fields.Many2many('ir.attachment', 'project_agreements_attachment_rel', 'agreement_id', 'attachment_id', string='Attachments')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('done', 'Done')
    ], string='Status', default='draft', tracking=True)

    letter_of_awarding = fields.Binary(string="Letter of Awarding", attachment=True, help="Upload the Letter of Awarding document here.")
    agreement = fields.Binary(string="Agreement", attachment=True, help="Upload the Agreement document here.")
    stamped_ifc = fields.Binary(string="Stamped IFC", attachment=True, help="Upload the Stamped IFC document here.")
    letter_of_awarding_filename = fields.Char()
    agreement_filename = fields.Char()
    stamped_ifc_filename = fields.Char()

    def action_active(self):
        return self.write({'state': 'active'})

    def action_done(self):
        return self.write({'state': 'done'})

    def action_cancel(self):
        return self.write({'state': 'cancel'})


    def create_owncloud_folder(self, folder_path):
        base_url = 'http://localhost:8080/remote.php/webdav/'
        full_url = base_url + folder_path
        auth = HTTPBasicAuth('admin', 'admin')

        _logger.info(f"[OwnCloud] Attempting to create folder: {full_url}")
        response = requests.request('MKCOL', full_url, auth=auth)
        _logger.info(f"[OwnCloud] Response: {response.status_code} - {response.text}")
        return response.status_code
    

    def upload_to_owncloud(self, folder_path, filename, file_content):

        base_url = 'http://localhost:8080/remote.php/webdav/'
        full_url = base_url + folder_path + '/' + filename
        auth = HTTPBasicAuth('admin', 'admin')

        headers = {
            'Content-Type': 'application/octet-stream'
        }

        file_data = base64.b64decode(file_content)

        _logger.info(f"[OwnCloud] Uploading file: {filename} to {full_url}")
        response = requests.put(full_url, auth=auth, headers=headers, data=file_data)

        if response.status_code in [200, 201, 204]:
            _logger.info(f"[OwnCloud] File uploaded successfully: {filename}")
        else:
            _logger.warning(f"[OwnCloud] Failed to upload file {filename}. Status: {response.status_code} - {response.text}")




    @api.model
    def create(self, vals):
        if vals.get('name', _('New')) == _('New'):
            vals['name'] = self.env['ir.sequence'].next_by_code('project.agreements') or _('New')

        record = super(ProjectAgreements, self).create(vals)

        folder_name = record.name.replace(' ', '_')
        agreement_base_path = f"OdooDocuments/Agreements/{folder_name}"

        _logger.info(f"[Odoo] Creating OwnCloud folder structure for Agreement: {folder_name}")

        # Ensure base folders exist
        record.create_owncloud_folder("OdooDocuments")
        record.create_owncloud_folder("OdooDocuments/Agreements")

        base_response = record.create_owncloud_folder(agreement_base_path)
        if base_response not in [200, 201, 204, 405]:
            _logger.warning(f"[OwnCloud] Failed to create base folder '{agreement_base_path}' — skipping subfolder creation.")
            return record

        # Subfolders
        record.create_owncloud_folder(f"{agreement_base_path}/1- Letter of Awarding")
        record.create_owncloud_folder(f"{agreement_base_path}/2- Agreement")
        record.create_owncloud_folder(f"{agreement_base_path}/3- Stamped IFC")

        # Upload files if provided
        def try_upload(field_name, folder_suffix, filename_field):
            if vals.get(field_name) and vals.get(filename_field):
                record.upload_to_owncloud(
                    folder_path=f"{agreement_base_path}/{folder_suffix}",
                    filename=vals[filename_field],
                    file_content=vals[field_name]
                )

        try_upload('letter_of_awarding', '1- Letter of Awarding', 'letter_of_awarding_filename')
        try_upload('agreement', '2- Agreement', 'agreement_filename')
        try_upload('stamped_ifc', '3- Stamped IFC', 'stamped_ifc_filename')

        return record
    

    def write(self, vals):
        res = super().write(vals)

        for record in self:
            folder_base = f"OdooDocuments/Agreements/{record.name}"  # Or use record.agreement_code if more accurate

            if vals.get('letter_of_awarding') and record.letter_of_awarding_filename:
                self.upload_to_owncloud(folder_base + "/1- Letter of Awarding", record.letter_of_awarding_filename, record.letter_of_awarding)

            if vals.get('agreement') and record.agreement_filename:
                self.upload_to_owncloud(folder_base + "/2- Agreement", record.agreement_filename, record.agreement)

            if vals.get('stamped_ifc') and record.stamped_ifc_filename:
                self.upload_to_owncloud(folder_base + "/3- Stamped IFC", record.stamped_ifc_filename, record.stamped_ifc)

        return res
    

    def unlink(self):
        for record in self:
            if record.state == 'done':
                raise UserError(_("You cannot delete an agreement that is in 'Done' state."))
        return super(ProjectAgreements, self).unlink()