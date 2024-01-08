import type { Context, Service, ServiceSchema } from "moleculer";
import { ActionQuantityParams } from "./products.service";
import DbService from "../mixins/db.mixin";
import { DbServiceSettings, MoleculerDbMethods, DbAdapter } from "moleculer-db";
import MongoDbAdapter from "moleculer-db-adapter-mongo";

export interface ProductSettings extends DbServiceSettings {
	// mongodb: string; // Add the 'mongodb' property here
	// collection: string;
	indexes?: Record<string, number>[];
}

export interface ProductsThis extends Service<ProductSettings>, MoleculerDbMethods {
	adapter: DbAdapter | MongoDbAdapter;
}

const WarehouseService: ServiceSchema<ProductSettings> = {
	name: "warehouse",

    /**
	 * Mixins
	 */
	mixins: [DbService("products")],

	/**
	 * Settings
	 */
	settings: {
		// mongodb: process.env.MONGO_URI || "mongodb://localhost:27017/products",
		// collection: "products",
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
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		productCount: {
            rest: "GET /productCount/:id",
			params: {
				id: "string",
			},
			async handler(this: ProductsThis, ctx: Context<ActionQuantityParams>): Promise<void>  {
                try {
                    const doc: any = await this.adapter.findById(ctx.params.id);
                    if(!doc) {
                        throw new Error('Product not found');
                    }
                    return doc.quantity;
                } catch (error) {
                    // Handle any errors
					console.error('Error retrieving product:', error);
					throw error; // Rethrow the error or handle it accordingly
                }
			},
		},
	},

	/**
	 * Events
	 */
	events: {
        "product.purchased": {
            async handler(this: ProductsThis, ctx: Context<ActionQuantityParams>): Promise<any> {
                const doc = await this.adapter.updateById(ctx.params.id, {	
					$set : { quantity: ctx.params.quantity },
				});
                const json = await this.transformDocuments(ctx, ctx.params, doc);
				await this.entityChanged("updated", json, ctx);
                return json;
            },
        }
    },

	/**
	 * Methods
	 */
	methods: {},

};

export default WarehouseService;
