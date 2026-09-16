# Lee un PNG sin dependencias y devuelve la última fila cuyo contenido no es
# magenta puro: el punto donde termina el contenido del artboard.
import zlib, struct, json, sys

def alto_contenido(path):
    d = open(path,'rb').read()
    pos, w, h, idat = 8, 0, 0, b''
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]
        typ = d[pos+4:pos+8]
        data = d[pos+8:pos+8+ln]
        if typ == b'IHDR':
            w, h, depth, ctype = struct.unpack('>IIBB', data[:10])
            if depth != 8: raise SystemExit('profundidad no soportada: %d' % depth)
            canales = {0:1, 2:3, 3:1, 4:2, 6:4}[ctype]
        elif typ == b'IDAT': idat += data
        elif typ == b'IEND': break
        pos += 12 + ln
    raw = zlib.decompress(idat)
    bpp = canales
    stride = w * bpp
    prev = bytearray(stride)
    ultima = 0
    off = 0
    for y in range(h):
        filtro = raw[off]; off += 1
        linea = bytearray(raw[off:off+stride]); off += stride
        for i in range(stride):
            a = linea[i-bpp] if i >= bpp else 0
            b = prev[i]
            c = prev[i-bpp] if i >= bpp else 0
            if filtro == 1: linea[i] = (linea[i] + a) & 255
            elif filtro == 2: linea[i] = (linea[i] + b) & 255
            elif filtro == 3: linea[i] = (linea[i] + (a+b)//2) & 255
            elif filtro == 4:
                p = a + b - c
                pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                linea[i] = (linea[i] + pr) & 255
        # ¿alguna muestra de esta fila no es magenta?
        for x in range(0, stride, bpp):
            if not (linea[x] > 240 and linea[x+1] < 20 and linea[x+2] > 240):
                ultima = y + 1
                break
        prev = linea
    return ultima

filas = json.load(open('.audit/index.json'))
print(f"{'ARTBOARD':24} {'DECL':>6} {'REAL':>6} {'HOLGURA':>8}")
malos = []
for r in filas:
    real = alto_contenido('.audit/%s.png' % r['nombre'])
    holg = r['h'] - real
    marca = ''
    if holg < 0: marca = '  ← RECORTADO'; malos.append((r['nombre'], r['h'], real))
    elif holg > 180: marca = '  ← sobra'; malos.append((r['nombre'], r['h'], real))
    print(f"{r['nombre']:24} {r['h']:>6} {real:>6} {holg:>8}{marca}")
json.dump(malos, open('.audit/malos.json','w'))
