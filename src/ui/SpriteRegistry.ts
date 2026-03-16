export class SpriteRegistry {
  private _sprites: Map<string, string> = new Map();

  public loadAll(): void {
    const svgModules = import.meta.glob('../sprites/**/*.svg', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    for (const [path, content] of Object.entries(svgModules)) {
      const name = path.split('/').pop()!.replace('.svg', '');
      this._sprites.set(name, content);
    }
  }

  public get(name: string): string {
    return this._sprites.get(name) ?? '';
  }
}
