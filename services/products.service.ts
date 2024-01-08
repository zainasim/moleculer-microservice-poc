import type { Context, Service, ServiceSchema } from "moleculer";
import type { DbServiceSettings, MoleculerDbMethods } from "moleculer-db";
import MongoDbAdapter from "moleculer-db-adapter-mongo";
import DbService from "../mixins/db.mixin";

export interface ProductEntity {
	name: string;
	quantity: number;
	price: number;
	_id: string;
}

export type ActionCreateParams = Partial<ProductEntity>;

export interface ActionQuantityParams {
	id: string;
	value: number;
	quantity: number;
}

export interface ProductSettings extends DbServiceSettings {
	indexes?: Record<string, number>[];
}

export interface ProductsThis extends Service<ProductSettings>, MoleculerDbMethods {
	adapter: MongoDbAdapter;
}

const ProductsService: ServiceSchema<ProductSettings> = {
	name: "products",
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbService("products")],
	/**
	 * Settings
	 */
	settings: {
		// Available fields in the responses
		fields: ["_id", "name", "quantity", "price"],

		// Validator for the `create` & `insert` actions.
		entityValidator: {
			name: "string|min:3",
			price: "number|positive",
		},

		indexes: [{ name: 1 }],
	},

	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			/**
			 * Register a before hook for the `create` action.
			 * It sets a default value for the quantity field.
			 */
			create(ctx: Context<ProductEntity>) {
				if(ctx.params.quantity <= 0) {
					throw new Error('Quantity must be atleast 1');
				}
			},
			/**
			 * 
			 * this before hooks verifies quantity of selected product
			 */
			buyProduct(ctx: Context<ProductEntity>) {
				if(ctx.params.quantity <= 0) {
					throw new Error('Quantity must be atleast 1');
				}
			}
		},
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * The "moleculer-db" mixin registers the following actions:
		 *  - list
		 *  - find
		 *  - count
		 *  - create
		 *  - insert
		 *  - update
		 *  - remove
		 */
		
		/**
		 * this function caters buying product mechanism
		 */
		buyProduct: {
			rest: "PUT /buyProduct/:id",
			params: {
				quantity: "number|integer",
			},
			async handler(this: ProductsThis, ctx: Context<ActionQuantityParams>): Promise<string> {
				try {
					const doc: any = await this.adapter.findById(ctx.params.id);
					// Handle the case where the document is not found
					if (!doc) {
						throw new Error('Product not found');
					}
					if(ctx.params.quantity > doc.quantity) {
						throw new Error('Required Product Quantity Exceeds');
					}
					// Emitting event
					const updatedDoc: any = await this.broker.emit('product.purchased', {
						id: doc._id,
						quantity: doc.quantity - ctx.params.quantity,
					});


					return `${ctx.params.quantity} ${doc.name} Bought Successfuly And Remaining Amount is ${doc.quantity - ctx.params.quantity}`;
				} catch (error) {
					// Handle any errors
					console.error('Error retrieving product:', error);
					throw error; // Rethrow the error or handle it accordingly
				}
			},
		},
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Loading sample data to the collection.
		 * It is called in the DB.mixin after the database
		 * connection establishing & the collection is empty.
		 */
		async seedDB(this: ProductsThis) {
			await this.adapter.insertMany([
				{ name: "Samsung Galaxy S10 Plus", quantity: 10, price: 704 },
				{ name: "iPhone 11 Pro", quantity: 25, price: 999 },
				{ name: "Huawei P30 Pro", quantity: 15, price: 679 },
			]);
		},
	},

	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected(this: ProductsThis) {
		if ("collection" in this.adapter) {
			if (this.settings.indexes) {
				await Promise.all(
					this.settings.indexes.map((index) =>
						(<MongoDbAdapter>this.adapter).collection.createIndex(index),
					),
				);
			}
		}
	},
};

export default ProductsService;
