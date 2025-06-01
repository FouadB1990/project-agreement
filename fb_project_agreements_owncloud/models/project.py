
from datetime import timedelta
from odoo import api, fields, models, tools, SUPERUSER_ID, _
from odoo.exceptions import UserError, ValidationError
import logging
import requests
from requests.auth import HTTPBasicAuth

_logger = logging.getLogger(__name__)




class ProjectAgreements(models.Model):
    _inherit = 'project.project'


    agreement_id = fields.Many2one('project.agreements', string='Agreement', ondelete='cascade', required=True, help="The agreement this project is associated with.")

    def create_owncloud_folder(self, folder_path):
        base_url = 'http://localhost:8080/remote.php/webdav/'
        full_url = base_url + folder_path
        auth = HTTPBasicAuth('admin', 'admin')

        _logger.info(f"[OwnCloud] Attempting to create folder: {full_url}")
        response = requests.request('MKCOL', full_url, auth=auth)

        if response.status_code == 405:
            _logger.info(f"[OwnCloud] Folder already exists: {folder_path}")
        elif response.status_code not in (201, 200):
            _logger.warning(f"[OwnCloud] Failed to create folder '{folder_path}' - {response.status_code}")
        return response.status_code

    @api.model
    def create(self, vals):
        project = super().create(vals)

        if project.name:
            try:
                base_path = 'OdooDocuments/Projects'
                main_folder = f"{base_path}/{project.name}"
                subfolders = [
                    "1- Designs",
                    "2- Approvals",
                    "3- Reports",
                ]

                # Ensure base folders exist
                self.create_owncloud_folder('OdooDocuments')
                self.create_owncloud_folder(base_path)
                self.create_owncloud_folder(main_folder)

                for folder in subfolders:
                    self.create_owncloud_folder(f"{main_folder}/{folder}")

                _logger.info(f"[Odoo] Created OwnCloud folder structure for Project: {project.name}")
            except Exception as e:
                _logger.exception(f"[Odoo] Exception during OwnCloud folder creation for project: {e}")

        return project