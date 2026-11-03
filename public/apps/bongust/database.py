import sqlite3
from datetime import datetime

DB_NAME = "forn.db"


def connect():
    return sqlite3.connect(DB_NAME)


def crear_tablas():
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS producto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            tipo TEXT NOT NULL,
            precio REAL NOT NULL,
            stock INTEGER NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS movimiento (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            producto_id INTEGER NOT NULL,
            cantidad INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            tipo TEXT NOT NULL,
            FOREIGN KEY(producto_id) REFERENCES producto(id)
        )
    """)

    conn.commit()
    conn.close()

#----------------------
# CRUD PRODUCTO

def crear_producto(nombre, tipo, precio, stock):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO producto (nombre, tipo, precio, stock) VALUES (?, ?, ?, ?)",
        (nombre, tipo, precio, stock)
    )
    conn.commit()
    conn.close()


def listar_productos():
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM producto")
    productos = cursor.fetchall()
    conn.close()
    return productos


def actualizar_producto(id, nombre, tipo, precio, stock):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE producto
        SET nombre=?, tipo=?, precio=?, stock=?
        WHERE id=?
    """, (nombre, tipo, precio, stock, id))
    conn.commit()
    conn.close()


def eliminar_producto(id):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM producto WHERE id=?", (id,))
    conn.commit()
    conn.close()


# ----------------------
# CRUD MOVIMIENTO


def crear_movimiento(producto_id, cantidad, tipo):
    conn = connect()
    cursor = conn.cursor()

    fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Actualizar stock automáticamente
    if tipo == "entrada":
        cursor.execute("UPDATE producto SET stock = stock + ? WHERE id=?", (cantidad, producto_id))
    elif tipo == "salida":
        cursor.execute("UPDATE producto SET stock = stock - ? WHERE id=?", (cantidad, producto_id))

    cursor.execute("""
        INSERT INTO movimiento (producto_id, cantidad, fecha, tipo)
        VALUES (?, ?, ?, ?)
    """, (producto_id, cantidad, fecha, tipo))

    conn.commit()
    conn.close()


def listar_movimientos():
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM movimiento")
    movimientos = cursor.fetchall()
    conn.close()
    return movimientos


def eliminar_movimiento(id):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM movimiento WHERE id=?", (id,))
    conn.commit()
    conn.close()
