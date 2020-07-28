import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (customer === undefined) {
      throw new AppError('Customer have a invalid id');
    }

    const verifyProducts = await this.productsRepository.findAllById(products);

    if (verifyProducts.length !== products.length) {
      throw new AppError('Product is invalid');
    }

    const productsUpdated = await this.productsRepository.updateQuantity(
      products,
    );

    const newProductsList = productsUpdated.map((product, index, array) => {
      const aux = {
        product_id: product.id,
        price: product.price,
        quantity: product.quantity,
      };
      return aux;
    });

    const order = await this.ordersRepository.create({
      customer,
      products: newProductsList,
    });

    return order;
  }
}

export default CreateOrderService;
