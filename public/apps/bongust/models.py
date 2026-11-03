class Producto:
    def __init__(self, id, nombre, tipo, precio, stock):
        self.id = id
        self.nombre = nombre
        self.tipo = tipo
        self.precio = precio
        self.stock = stock

    def __str__(self):
        return f"ID: {self.id} | {self.nombre} ({self.tipo}) | Precio: {self.precio}€ | Stock: {self.stock}"


class MovimientoStock:
    def __init__(self, id, producto_id, cantidad, fecha, tipo):
        self.id = id
        self.producto_id = producto_id
        self.cantidad = cantidad
        self.fecha = fecha
        self.tipo = tipo

    def __str__(self):
        return f"ID: {self.id} | Producto ID: {self.producto_id} | {self.tipo} | Cantidad: {self.cantidad} | Fecha: {self.fecha}"
