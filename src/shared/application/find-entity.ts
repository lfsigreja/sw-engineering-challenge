export async function findEntity<T>(
  findById: (id: string) => Promise<T | undefined>,
  id: string,
  ErrorClass: new (id: string) => Error,
): Promise<T> {
  const entity = await findById(id);
  if (!entity) throw new ErrorClass(id);
  return entity;
}
