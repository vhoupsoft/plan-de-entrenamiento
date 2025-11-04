import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import prisma from '../prismaClient';
import bcrypt from 'bcryptjs';

// ============ EJERCICIOS ============

export const importEjercicios = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo CSV' });
    }

    const skipFirstRow = req.body.skipFirstRow === 'true' || req.body.skipFirstRow === true;

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      delimiter: ';',
      columns: skipFirstRow ? true : ['Codigo', 'Descripcion', 'PasoImagenes', 'LinkExternos'],
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      quote: '"',
      escape: '"',
      from_line: skipFirstRow ? 1 : 1,
    }) as any[];

    const results = {
      total: records.length,
      insertados: 0,
      omitidos: 0,
      errores: [] as string[],
    };

    for (const record of records) {
      try {
        const codigo = record.Codigo || record.codigo || record.Código;
        const descripcion = record.Descripcion || record.descripcion;
        const imagenes = record.PasoImagenes || record.pasoImagenes || record.imagenes || null;
        const links = record.LinkExternos || record.linkExternos || record.links || null;

        if (!codigo || !descripcion) {
          results.errores.push(`Fila sin código o descripción: ${JSON.stringify(record)}`);
          continue;
        }

        // Verificar si ya existe
        const existe = await prisma.ejercicio.findUnique({
          where: { codEjercicio: codigo },
        });

        if (existe) {
          results.omitidos++;
          continue;
        }

        // Insertar
        await prisma.ejercicio.create({
          data: {
            codEjercicio: codigo,
            descripcion,
            imagenes,
            links,
          },
        });

        results.insertados++;
      } catch (err: any) {
        results.errores.push(`Error en fila ${JSON.stringify(record)}: ${err.message}`);
      }
    }

    res.json(results);
  } catch (err: any) {
    console.error('importEjercicios error:', err);
    res.status(500).json({ error: 'Error al importar ejercicios', details: err.message });
  }
};

export const exportEjercicios = async (req: Request, res: Response) => {
  try {
    const ejercicios = await prisma.ejercicio.findMany({
      orderBy: { id: 'asc' },
    });

    const records = ejercicios.map((ej) => ({
      ID: ej.id,
      Codigo: ej.codEjercicio,
      Descripcion: ej.descripcion,
      PasoImagenes: ej.imagenes || '',
      LinkExternos: ej.links || '',
    }));

    const csv = stringify(records, {
      header: true,
      columns: ['ID', 'Codigo', 'Descripcion', 'PasoImagenes', 'LinkExternos'],
      delimiter: ';',
      quoted: true,
      quoted_string: true,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=ejercicios.csv');
    res.send(csv);
  } catch (err: any) {
    console.error('exportEjercicios error:', err);
    res.status(500).json({ error: 'Error al exportar ejercicios', details: err.message });
  }
};

// ============ PERSONAS ============

export const importPersonas = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo CSV' });
    }

    const skipFirstRow = req.body.skipFirstRow === 'true' || req.body.skipFirstRow === true;

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      delimiter: ';',
      columns: skipFirstRow ? true : ['DNI', 'Nombre', 'esAlumno', 'esEntrenador', 'alumnoActivo', 'entrenadorActivo', 'usuario', 'clave'],
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      quote: '"',
      escape: '"',
      from_line: skipFirstRow ? 1 : 1,
    }) as any[];

    const results = {
      total: records.length,
      insertados: 0,
      omitidos: 0,
      errores: [] as string[],
    };

    for (const record of records) {
      try {
        const dni = record.DNI || record.dni;
        const nombre = record.Nombre || record.nombre;
        const usuario = record.usuario || record.Usuario;
        const clave = record.clave || record.Clave;

        // Parsear booleanos: S/N o 1/0
        const parseBoolean = (val: any): boolean => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'number') return val === 1;
          const str = String(val).trim().toUpperCase();
          return str === 'S' || str === '1' || str === 'TRUE';
        };

        const esAlumno = parseBoolean(record.esAlumno);
        const esEntrenador = parseBoolean(record.esEntrenador);
        const alumnoActivo = parseBoolean(record.alumnoActivo);
        const entrenadorActivo = parseBoolean(record.entrenadorActivo);

        if (!dni || !nombre || !usuario || !clave) {
          results.errores.push(`Fila sin DNI, nombre, usuario o clave: ${JSON.stringify(record)}`);
          continue;
        }

        // Verificar si ya existe por DNI o usuario
        const existe = await prisma.persona.findFirst({
          where: {
            OR: [{ dni }, { usuario }],
          },
        });

        if (existe) {
          results.omitidos++;
          continue;
        }

        // Hash de la clave
        const hashedClave = await bcrypt.hash(clave, 10);

        // Insertar
        await prisma.persona.create({
          data: {
            dni,
            nombre,
            usuario,
            clave: hashedClave,
            esAlumno,
            esEntrenador,
            alumnoActivo,
            entrenadorActivo,
          },
        });

        results.insertados++;
      } catch (err: any) {
        results.errores.push(`Error en fila ${JSON.stringify(record)}: ${err.message}`);
      }
    }

    res.json(results);
  } catch (err: any) {
    console.error('importPersonas error:', err);
    res.status(500).json({ error: 'Error al importar personas', details: err.message });
  }
};

export const exportPersonas = async (req: Request, res: Response) => {
  try {
    const personas = await prisma.persona.findMany({
      orderBy: { id: 'asc' },
    });

    const records = personas.map((p) => ({
      ID: p.id,
      DNI: p.dni,
      Nombre: p.nombre,
      esAlumno: p.esAlumno ? 'S' : 'N',
      esEntrenador: p.esEntrenador ? 'S' : 'N',
      alumnoActivo: p.alumnoActivo ? 'S' : 'N',
      entrenadorActivo: p.entrenadorActivo ? 'S' : 'N',
      usuario: p.usuario,
      clave: '***', // Por seguridad no exportamos claves en texto plano
    }));

    const csv = stringify(records, {
      header: true,
      columns: ['ID', 'DNI', 'Nombre', 'esAlumno', 'esEntrenador', 'alumnoActivo', 'entrenadorActivo', 'usuario', 'clave'],
      delimiter: ';',
      quoted: true,
      quoted_string: true,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=personas.csv');
    res.send(csv);
  } catch (err: any) {
    console.error('exportPersonas error:', err);
    res.status(500).json({ error: 'Error al exportar personas', details: err.message });
  }
};

// ============ EJERCICIOS JSON ============

export const importEjerciciosJson = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo JSON' });
    }

    const jsonContent = req.file.buffer.toString('utf-8');
    const records = JSON.parse(jsonContent);

    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'El JSON debe ser un array de objetos' });
    }

    const results = {
      total: records.length,
      insertados: 0,
      omitidos: 0,
      errores: [] as string[],
    };

    for (const record of records) {
      try {
        const codigo = record.Codigo || record.codigo || record.codEjercicio;
        const descripcion = record.Descripcion || record.descripcion;
        const imagenes = record.PasoImagenes || record.pasoImagenes || record.imagenes || null;
        const links = record.LinkExternos || record.linkExternos || record.links || null;

        if (!codigo || !descripcion) {
          results.errores.push(`Registro sin código o descripción: ${JSON.stringify(record)}`);
          continue;
        }

        // Verificar si ya existe
        const existe = await prisma.ejercicio.findUnique({
          where: { codEjercicio: codigo },
        });

        if (existe) {
          results.omitidos++;
          continue;
        }

        // Insertar
        await prisma.ejercicio.create({
          data: {
            codEjercicio: codigo,
            descripcion,
            imagenes,
            links,
          },
        });

        results.insertados++;
      } catch (err: any) {
        results.errores.push(`Error en registro ${JSON.stringify(record)}: ${err.message}`);
      }
    }

    res.json(results);
  } catch (err: any) {
    console.error('importEjerciciosJson error:', err);
    res.status(500).json({ error: 'Error al importar ejercicios desde JSON', details: err.message });
  }
};

export const exportEjerciciosJson = async (req: Request, res: Response) => {
  try {
    const ejercicios = await prisma.ejercicio.findMany({
      orderBy: { id: 'asc' },
    });

    const records = ejercicios.map((ej) => ({
      ID: ej.id,
      Codigo: ej.codEjercicio,
      Descripcion: ej.descripcion,
      PasoImagenes: ej.imagenes || '',
      LinkExternos: ej.links || '',
    }));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=ejercicios.json');
    res.json(records);
  } catch (err: any) {
    console.error('exportEjerciciosJson error:', err);
    res.status(500).json({ error: 'Error al exportar ejercicios a JSON', details: err.message });
  }
};

// ============ PERSONAS JSON ============

export const importPersonasJson = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo JSON' });
    }

    const jsonContent = req.file.buffer.toString('utf-8');
    const records = JSON.parse(jsonContent);

    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'El JSON debe ser un array de objetos' });
    }

    const results = {
      total: records.length,
      insertados: 0,
      omitidos: 0,
      errores: [] as string[],
    };

    for (const record of records) {
      try {
        const dni = record.DNI || record.dni;
        const nombre = record.Nombre || record.nombre;
        const usuario = record.usuario || record.Usuario;
        const clave = record.clave || record.Clave;

        // Parsear booleanos: S/N o 1/0 o true/false
        const parseBoolean = (val: any): boolean => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'number') return val === 1;
          const str = String(val).trim().toUpperCase();
          return str === 'S' || str === '1' || str === 'TRUE';
        };

        const esAlumno = parseBoolean(record.esAlumno);
        const esEntrenador = parseBoolean(record.esEntrenador);
        const alumnoActivo = parseBoolean(record.alumnoActivo);
        const entrenadorActivo = parseBoolean(record.entrenadorActivo);

        if (!dni || !nombre || !usuario || !clave) {
          results.errores.push(`Registro sin DNI, nombre, usuario o clave: ${JSON.stringify(record)}`);
          continue;
        }

        // Verificar si ya existe por DNI o usuario
        const existe = await prisma.persona.findFirst({
          where: {
            OR: [{ dni }, { usuario }],
          },
        });

        if (existe) {
          results.omitidos++;
          continue;
        }

        // Hash de la clave
        const hashedClave = await bcrypt.hash(clave, 10);

        // Insertar
        await prisma.persona.create({
          data: {
            dni,
            nombre,
            usuario,
            clave: hashedClave,
            esAlumno,
            esEntrenador,
            alumnoActivo,
            entrenadorActivo,
          },
        });

        results.insertados++;
      } catch (err: any) {
        results.errores.push(`Error en registro ${JSON.stringify(record)}: ${err.message}`);
      }
    }

    res.json(results);
  } catch (err: any) {
    console.error('importPersonasJson error:', err);
    res.status(500).json({ error: 'Error al importar personas desde JSON', details: err.message });
  }
};

export const exportPersonasJson = async (req: Request, res: Response) => {
  try {
    const personas = await prisma.persona.findMany({
      orderBy: { id: 'asc' },
    });

    const records = personas.map((p) => ({
      ID: p.id,
      DNI: p.dni,
      Nombre: p.nombre,
      esAlumno: p.esAlumno,
      esEntrenador: p.esEntrenador,
      alumnoActivo: p.alumnoActivo,
      entrenadorActivo: p.entrenadorActivo,
      usuario: p.usuario,
      clave: '***', // Por seguridad no exportamos claves en texto plano
    }));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=personas.json');
    res.json(records);
  } catch (err: any) {
    console.error('exportPersonasJson error:', err);
    res.status(500).json({ error: 'Error al exportar personas a JSON', details: err.message });
  }
};
