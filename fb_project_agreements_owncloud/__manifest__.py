# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Project Agreements OwnCloud',
    'version': '1.1',
    'category': 'Services/Project',
    'summary': 'Project Agreements Management with OwnCloud Integration',
    'author': 'Fouad Bittar',
    'description': """
        This module allows you to manage project agreements and integrate with OwnCloud for document management. It provides features to create, track, and manage agreements related to projects, enhancing collaboration and document sharing within the Odoo platform.""",
    'depends': ['project', 'base','sale'],
    'data': [
        'security/ir.model.access.csv',
        'data/ir_sequence_data.xml',
        'views/agreements_views.xml',
    ],
    
    'installable': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
