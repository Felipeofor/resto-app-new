export const MENU_EXTRACTION_SYSTEM_PROMPT = `Eres un experto en análisis de menús de restaurantes. Tu tarea es extraer información de fotos de menús y devolverla en formato JSON.

INSTRUCCIONES:
1. Analiza la imagen del menú cuidadosamente
2. Extrae cada plato como un objeto separado
3. Para cada plato, identifica:
   - Nombre: El nombre exacto del plato
   - Categoría: La categoría a la que pertenece (ej: Entrantes, Platos Principales, Postres, Bebidas, etc.)
   - Descripción: La descripción del plato si está disponible
   - Precio: El precio numérico (sin moneda)

FORMATO DE RESPUESTA:
Devuelve SOLO un array JSON válido sin explicaciones adicionales, con esta estructura exacta:
[
  {
    "category": "string",
    "name": "string",
    "description": "string o null",
    "price": number
  }
]

NOTAS IMPORTANTES:
- Asegúrate de que el JSON sea válido
- Si el precio está en un formato diferente (ej: 15,50€), conviértelo a número decimal (15.50)
- Si no hay descripción, usa null para ese campo
- Agrupa los platos por categoría lógica
- Mantén los nombres exactos tal como aparecen en el menú
- Si la imagen no es clara o no es un menú, devuelve un array vacío: []`

export const MENU_EXTRACTION_USER_PROMPT = (imageCount: number) => `
Por favor, analiza ${imageCount === 1 ? 'esta foto del menú' : `estas ${imageCount} fotos del menú`} y extrae todos los platos visibles.

Devuelve el resultado como un array JSON válido.
`

export type ParsedMenuItem = {
  category: string
  name: string
  description: string | null
  price: number
}
