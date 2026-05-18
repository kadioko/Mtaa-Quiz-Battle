export interface IAPItemDetails {
  productId: string;
  title?: string;
  description?: string;
  price?: string;
}

export const IAPService = {
  async connect(): Promise<void> {},
  async disconnect(): Promise<void> {},
  async getProducts(): Promise<IAPItemDetails[]> {
    return [];
  },
  async purchaseRemoveAds(): Promise<boolean> {
    return false;
  },
  async restorePurchases(): Promise<boolean> {
    return false;
  },
  async isAdFree(): Promise<boolean> {
    return false;
  },
  async _setPurchased(_value: boolean): Promise<void> {},
};
