import { Request, Response } from 'express';
import Product from '../models/product.model';

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, description } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: {
          name: !name ? 'Name is required' : undefined,
          price: !price ? 'Price is required' : undefined
        }
      });
    }

    const product = new Product({
      name,
      price,
      description
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate product name',
        details: 'A product with this name already exists'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while creating the product'
    });
  }
};

// Get all products with pagination and filters
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Extract filters from query parameters
    const search = req.query.search as string;
    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);

    // Build the query
    const query: any = {};

    // Add search filter if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Add price range filters if provided
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      query.price = {};
      if (!isNaN(minPrice)) {
        query.price.$gte = minPrice;
      }
      if (!isNaN(maxPrice)) {
        query.price.$lte = maxPrice;
      }
    }

    // Execute queries
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        search,
        minPrice,
        maxPrice
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while fetching products'
    });
  }
};

// Get a single product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        details: 'The requested product does not exist'
      });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while fetching the product'
    });
  }
};

// Update a product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, description, status } = req.body;

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        details: 'The product you are trying to update does not exist'
      });
    }

    // Update fields if provided
    if (name) product.name = name;
    if (price) product.price = price;
    if (description !== undefined) product.description = description;
    if (status !== undefined) product.status = status;

    await product.save();

    res.status(200).json({
      message: 'Product updated successfully',
      product
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate product name',
        details: 'A product with this name already exists'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while updating the product'
    });
  }
};

// Delete a product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        details: 'The product you are trying to delete does not exist'
      });
    }

    res.status(200).json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while deleting the product'
    });
  }
}; 