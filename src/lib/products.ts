export type StockLike = {
  stockQuantity: number;
  lowStockThreshold: number;
};

export function isInStock(product: StockLike): boolean {
  return product.stockQuantity > 0;
}

export function isLowStock(product: StockLike): boolean {
  return (
    product.stockQuantity > 0 &&
    product.stockQuantity <= product.lowStockThreshold
  );
}
