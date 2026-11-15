from . import admin_controller, auth_controller, catalogo_controller, pedido_controller

BLUEPRINTS = [
    auth_controller.bp,
    catalogo_controller.bp,
    pedido_controller.bp,
    admin_controller.bp,
    admin_controller.bp_uploads,
]
