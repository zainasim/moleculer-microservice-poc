STEPS:
 1) Run command docker-compose up --build
        This command will also seed some initial data
 2) Route: **http://localhost:3000/api/products**   **GET Request**
        This route will fetch all stored products
 3) Route: **http://localhost:3000/api/products/create**  **POST Request**
    **Body** : {
                    "name": "Samsung Galaxy S12 Plus",
                    "quantity": 20,
                    "price": 7044
               }
        This route with this body will create new product and these mentioned fields are required
 4) Route: **http://localhost:3000/api/warehouse/productCount/:id**  **GET Request**
        This route will fetch quantity of product whose id will be provided
 5) Route: **http://localhost:3000/api/products/buyProduct/:id**    **PUT Request**
    **Body** : {
                    "quantity": 2
               }
        This route will check quantity and will emit an event which another service named warehouse will listen and update the quantity of
        brought produc and you can see updated record using step 2 OR 4.