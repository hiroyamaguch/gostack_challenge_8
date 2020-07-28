import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const results = await this.ormRepository.findByIds(products);

    return results;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    let orderProducts: Product[] = [];

    const ArrayOfIds = products.map(product => {
      return product.id;
    });

    const stock = await this.ormRepository.find({
      id: In(ArrayOfIds),
    });

    orderProducts = products.map(product => {
      const indexOfProduct = stock.findIndex(p2 => p2.id === product.id);

      if (stock[indexOfProduct] === undefined) {
        throw new AppError(`Product ${product.id} not found in stock`);
      }

      if (stock[indexOfProduct].quantity <= product.quantity) {
        throw new AppError(
          `Product ${stock[indexOfProduct].name} not available in stock`,
        );
      }

      stock[indexOfProduct].quantity -= product.quantity;

      const { id, name, price, order_products, created_at, updated_at } = stock[
        indexOfProduct
      ];

      const orderProduct: Product = {
        id,
        name,
        price,
        quantity: product.quantity,
        order_products,
        created_at,
        updated_at,
      };

      return orderProduct;
    });

    await this.ormRepository.save(stock);

    return orderProducts;
  }
}

export default ProductsRepository;
