# main.py

from database import *
from models import Producto, MovimientoStock


def menu():
    print("\n--- GESTOR FORN BON GUST ---")
    print("1. Crear producto")
    print("2. Listar productos")
    print("3. Actualizar producto")
    print("4. Eliminar producto")
    print("5. Crear movimiento de stock")
    print("6. Listar movimientos")
    print("7. Eliminar movimiento")
    print("0. Salir")


def ejecutar():
    crear_tablas()

    while True:
        menu()
        opcion = input("Seleccione una opción: ")

        if opcion == "1":
            nombre = input("Nombre: ")
            tipo = input("Tipo: ")
            precio = float(input("Precio: "))
            stock = int(input("Stock inicial: "))
            crear_producto(nombre, tipo, precio, stock)
            print("Producto creado correctamente.")

        elif opcion == "2":
            productos = listar_productos()
            for p in productos:
                producto = Producto(*p)
                print(producto)

        elif opcion == "3":
            id = int(input("ID del producto: "))
            nombre = input("Nuevo nombre: ")
            tipo = input("Nuevo tipo: ")
            precio = float(input("Nuevo precio: "))
            stock = int(input("Nuevo stock: "))
            actualizar_producto(id, nombre, tipo, precio, stock)
            print("Producto actualizado.")

        elif opcion == "4":
            id = int(input("ID del producto a eliminar: "))
            eliminar_producto(id)
            print("Producto eliminado.")

        elif opcion == "5":
            producto_id = int(input("ID del producto: "))
            cantidad = int(input("Cantidad: "))
            tipo = input("Tipo (entrada/salida): ").lower()
            crear_movimiento(producto_id, cantidad, tipo)
            print("Movimiento registrado.")

        elif opcion == "6":
            movimientos = listar_movimientos()
            for m in movimientos:
                movimiento = MovimientoStock(*m)
                print(movimiento)

        elif opcion == "7":
            id = int(input("ID del movimiento a eliminar: "))
            eliminar_movimiento(id)
            print("Movimiento eliminado.")

        elif opcion == "0":
            print("Saliendo...")
            break

        else:
            print("Opción inválida.")


if __name__ == "__main__":
    ejecutar()
