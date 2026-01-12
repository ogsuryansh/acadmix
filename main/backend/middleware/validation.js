const Joi = require('joi');

// Validation schemas
const schemas = {
    // Auth schemas
    register: Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string()
            .min(6)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
            .required()
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    adminLogin: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    }),

    // Book schemas
    createBook: Joi.object({
        title: Joi.string().min(2).max(100).required(),
        description: Joi.string().min(10).max(1000).required(),
        image: Joi.string().uri().allow(''),
        category: Joi.string().valid('NEET', 'JEE').required(),
        section: Joi.string().valid('home', 'class11', 'class12', 'test').required(),
        price: Joi.number().min(0).max(10000).required(),
        priceDiscounted: Joi.number().min(0).max(10000).optional(),
        pages: Joi.number().min(1).max(10000).optional(),
        pdfUrl: Joi.string().uri().allow(''),
        demoPdfUrl: Joi.string().uri().allow(''),
        telegramLink: Joi.string().uri().allow(''),
        badge: Joi.string().max(20).allow(''),
        demo: Joi.string().valid('Yes', 'No').default('No'),
        isFree: Joi.boolean().default(false)
    }),

    updateBook: Joi.object({
        title: Joi.string().min(2).max(100),
        description: Joi.string().min(10).max(1000),
        image: Joi.string().uri().allow(''),
        category: Joi.string().valid('NEET', 'JEE'),
        section: Joi.string().valid('home', 'class11', 'class12', 'test'),
        price: Joi.number().min(0).max(10000),
        priceDiscounted: Joi.number().min(0).max(10000),
        pages: Joi.number().min(1).max(10000),
        pdfUrl: Joi.string().uri().allow(''),
        demoPdfUrl: Joi.string().uri().allow(''),
        telegramLink: Joi.string().uri().allow(''),
        badge: Joi.string().max(20).allow(''),
        demo: Joi.string().valid('Yes', 'No'),
        isFree: Joi.boolean()
    }).min(1),

    // Payment schemas
    submitPayment: Joi.object({
        utr: Joi.string().min(8).max(50).required(),
        bookId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        amount: Joi.number().min(0).max(10000).required()
    }),

    approvePayment: Joi.object({
        notes: Joi.string().max(500).optional().allow('')
    }),

    rejectPayment: Joi.object({
        rejectionReason: Joi.string().max(500).required()
    }),

    // User schemas
    updateUserRole: Joi.object({
        userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        role: Joi.string().valid('user', 'admin').required()
    }),

    updateUserStatus: Joi.object({
        userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        isActive: Joi.boolean().required()
    }),

    // Query params
    bookId: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    }),

    paymentId: Joi.object({
        paymentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    }),

    section: Joi.object({
        section: Joi.string().valid('home', 'class11', 'class12', 'test').optional()
    }),

    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    })
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        // Replace request data with validated and sanitized data
        req[property] = value;
        next();
    };
};

module.exports = {
    schemas,
    validate
};
