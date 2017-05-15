export class Ingredient {
  public name: string;
  public percentage: number;

  public updateFrom(src: Ingredient): void {
    this.name = src.name;
    this.percentage = src.percentage;
  }
}
