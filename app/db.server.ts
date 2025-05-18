
import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient;
}

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

export default prisma;

// Helper functions for dealing with Shopify product settings
export async function getProductFormSettings(productId: string, shopId: string) {
  try {
    return await prisma.shopifyProductSetting.findUnique({
      where: {
        shopId_productId: {
          shopId,
          productId
        }
      }
    });
  } catch (error) {
    console.error("Error getting product form settings:", error);
    return null;
  }
}

export async function createOrUpdateProductFormSettings(
  shopId: string,
  productId: string,
  formId: string,
  blockId?: string,
  enabled: boolean = true
) {
  try {
    return await prisma.shopifyProductSetting.upsert({
      where: {
        shopId_productId: {
          shopId,
          productId
        }
      },
      update: {
        formId,
        blockId,
        enabled,
        updatedAt: new Date()
      },
      create: {
        shopId,
        productId,
        formId,
        blockId,
        enabled
      }
    });
  } catch (error) {
    console.error("Error updating product form settings:", error);
    return null;
  }
}

// Helper functions for form insertion settings
export async function getFormInsertionSettings(formId: string, shopId: string) {
  try {
    return await prisma.shopifyFormInsertion.findUnique({
      where: {
        formId_shopId: {
          formId,
          shopId
        }
      }
    });
  } catch (error) {
    console.error("Error getting form insertion settings:", error);
    return null;
  }
}

export async function createOrUpdateFormInsertionSettings(
  formId: string,
  shopId: string,
  settings: {
    position?: string;
    blockId?: string;
    themeType?: string;
    insertionMethod?: string;
  }
) {
  try {
    return await prisma.shopifyFormInsertion.upsert({
      where: {
        formId_shopId: {
          formId,
          shopId
        }
      },
      update: {
        position: settings.position,
        blockId: settings.blockId,
        themeType: settings.themeType,
        insertionMethod: settings.insertionMethod,
        updatedAt: new Date()
      },
      create: {
        formId,
        shopId,
        position: settings.position || 'product-page',
        blockId: settings.blockId,
        themeType: settings.themeType || 'auto-detect',
        insertionMethod: settings.insertionMethod || 'auto'
      }
    });
  } catch (error) {
    console.error("Error updating form insertion settings:", error);
    return null;
  }
}
