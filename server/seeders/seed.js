const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const Admin = require('../models/Admin');
const HomeCook = require('../models/HomeCook');
const Customer = require('../models/Customer');
const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Admin.deleteMany({}),
      HomeCook.deleteMany({}),
      Customer.deleteMany({}),
      DeliveryPartner.deleteMany({}),
      Order.deleteMany({}),
      MenuItem.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Admin
    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@cloudkitchen.com',
      password: 'admin123',
      role: 'superadmin',
    });
    console.log('👑 Admin created: admin@cloudkitchen.com / admin123');

    // Create Home Cooks
    const homeCooks = await HomeCook.create([
      {
        name: 'Priya Sharma',
        email: 'priya@homecook.com',
        phone: '9876543210',
        password: 'cook123',
        address: { street: '12 RS Puram', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641002' },
        speciality: ['North Indian', 'Mughlai', 'Tandoor'],
        status: 'approved',
        rating: 4.8,
        totalOrders: 342,
        revenue: 256800,
        bio: 'Passionate home cook specializing in authentic North Indian cuisine for 15+ years.',
      },
      {
        name: 'Lakshmi Devi',
        email: 'lakshmi@homecook.com',
        phone: '9876543211',
        password: 'cook123',
        address: { street: '45 Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040' },
        speciality: ['South Indian', 'Chettinad', 'Kerala'],
        status: 'approved',
        rating: 4.6,
        totalOrders: 289,
        revenue: 198400,
        bio: 'Traditional South Indian cooking passed down through generations.',
      },
      {
        name: 'Anita Patel',
        email: 'anita@homecook.com',
        phone: '9876543212',
        password: 'cook123',
        address: { street: '78 Law Garden', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641018' },
        speciality: ['Gujarati', 'Rajasthani', 'Street Food'],
        status: 'pending',
        rating: 0,
        totalOrders: 0,
        revenue: 0,
        bio: 'Authentic Gujarati thali specialist with organic ingredients.',
      },
      {
        name: 'Meera Krishnan',
        email: 'meera@homecook.com',
        phone: '9876543213',
        password: 'cook123',
        address: { street: '22 Thillai Nagar', city: 'Trichy', state: 'Tamil Nadu', pincode: '620018' },
        speciality: ['Continental', 'Italian', 'Fusion'],
        status: 'approved',
        rating: 4.9,
        totalOrders: 567,
        revenue: 425600,
        bio: 'Trained in Italian cuisine, bringing world flavors to your doorstep.',
      },
      {
        name: 'Fatima Khan',
        email: 'fatima@homecook.com',
        phone: '9876543214',
        password: 'cook123',
        address: { street: '56 Cumbum Road', city: 'Theni', state: 'Tamil Nadu', pincode: '625531' },
        speciality: ['Hyderabadi', 'Biryani', 'Kebabs'],
        status: 'approved',
        rating: 4.7,
        totalOrders: 478,
        revenue: 389200,
        bio: 'Famous for authentic Hyderabadi Dum Biryani and Haleem.',
      },
      {
        name: 'Sunita Rao',
        email: 'sunita@homecook.com',
        phone: '9876543215',
        password: 'cook123',
        address: { street: '33 Periyakulam Road', city: 'Theni', state: 'Tamil Nadu', pincode: '625531' },
        speciality: ['Chinese', 'Thai', 'Pan-Asian'],
        status: 'suspended',
        rating: 3.2,
        totalOrders: 89,
        revenue: 45600,
        bio: 'Asian cuisine enthusiast with a focus on authentic flavors.',
      },
      {
        name: 'Rekha Joshi',
        email: 'rekha@homecook.com',
        phone: '9876543216',
        password: 'cook123',
        address: { street: '11 Fairlands', city: 'Salem', state: 'Tamil Nadu', pincode: '636016' },
        speciality: ['Bengali', 'Assamese'],
        status: 'pending',
        rating: 0,
        totalOrders: 0,
        revenue: 0,
        bio: 'Bengali cuisine specialist – from fish curry to rosogolla.',
      },
      {
        name: 'Kavitha Nair',
        email: 'kavitha@homecook.com',
        phone: '9876543217',
        password: 'cook123',
        address: { street: '67 Gandhipuram', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641012' },
        speciality: ['Kerala', 'Seafood', 'Malabar'],
        status: 'approved',
        rating: 4.5,
        totalOrders: 234,
        revenue: 178900,
        bio: 'Kerala coastal cuisine with fresh catch of the day.',
      },
    ]);
    console.log(`👩‍🍳 ${homeCooks.length} Home Cooks created`);

    // Create Customers
    const customers = await Customer.create([
      {
        name: 'Rahul Verma',
        email: 'rahul@customer.com',
        phone: '8765432100',
        password: 'customer123',
        addresses: [{ label: 'Home', street: '15 Sector 44', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641002' }],
        status: 'active',
        totalOrders: 45,
        totalSpent: 32500,
        lastOrderDate: new Date('2026-07-10'),
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha@customer.com',
        phone: '8765432101',
        password: 'customer123',
        addresses: [{ label: 'Home', street: '78 Whitefield', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641018' }],
        status: 'active',
        totalOrders: 78,
        totalSpent: 56200,
        lastOrderDate: new Date('2026-07-11'),
      },
      {
        name: 'Amit Shah',
        email: 'amit@customer.com',
        phone: '8765432102',
        password: 'customer123',
        addresses: [
          { label: 'Home', street: '22 Andheri West', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641002' },
          { label: 'Office', street: '45 BKC', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641018' },
        ],
        status: 'active',
        totalOrders: 123,
        totalSpent: 89500,
        lastOrderDate: new Date('2026-07-09'),
      },
      {
        name: 'Divya Menon',
        email: 'divya@customer.com',
        phone: '8765432103',
        password: 'customer123',
        addresses: [{ label: 'Home', street: '9 Adyar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600020' }],
        status: 'active',
        totalOrders: 34,
        totalSpent: 24100,
        lastOrderDate: new Date('2026-07-08'),
      },
      {
        name: 'Vikram Singh',
        email: 'vikram@customer.com',
        phone: '8765432104',
        password: 'customer123',
        addresses: [{ label: 'Home', street: '56 Civil Lines', city: 'Trichy', state: 'Tamil Nadu', pincode: '620018' }],
        status: 'blocked',
        totalOrders: 12,
        totalSpent: 8900,
        lastOrderDate: new Date('2026-06-15'),
      },
      {
        name: 'Neha Kapoor',
        email: 'neha@customer.com',
        phone: '8765432105',
        password: 'customer123',
        addresses: [{ label: 'Home', street: '33 Connaught Place', city: 'Theni', state: 'Tamil Nadu', pincode: '625531' }],
        status: 'active',
        totalOrders: 67,
        totalSpent: 48700,
        lastOrderDate: new Date('2026-07-11'),
      },
      {
        name: 'Arjun Reddy',
        email: 'arjun@customer.com',
        phone: '8765432106',
        password: 'customer123',
        addresses: [{ label: 'Home', street: '89 Jubilee Hills', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641002' }],
        status: 'active',
        totalOrders: 91,
        totalSpent: 67300,
        lastOrderDate: new Date('2026-07-10'),
      },
      {
        name: 'Pooja Nair',
        email: 'pooja@customer.com',
        phone: '8765432107',
        password: 'customer123',
        addresses: [{ label: 'Home', street: '12 MG Road', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641012' }],
        status: 'active',
        totalOrders: 56,
        totalSpent: 41200,
        lastOrderDate: new Date('2026-07-07'),
      },
      {
        name: 'Karan Malhotra',
        email: 'karan@customer.com',
        phone: '8765432108',
        password: 'customer123',
        addresses: [{ label: 'Home', street: '44 Salt Lake', city: 'Salem', state: 'Tamil Nadu', pincode: '636016' }],
        status: 'active',
        totalOrders: 28,
        totalSpent: 19600,
        lastOrderDate: new Date('2026-07-06'),
      },
      {
        name: 'Riya Das',
        email: 'riya@customer.com',
        phone: '8765432109',
        password: 'customer123',
        addresses: [{ label: 'Home', street: '67 Park Street', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641012' }],
        status: 'active',
        totalOrders: 43,
        totalSpent: 31400,
        lastOrderDate: new Date('2026-07-05'),
      },
    ]);
    console.log(`👥 ${customers.length} Customers created`);

    // Create Delivery Partners
    const deliveryPartners = await DeliveryPartner.insertMany([
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@delivery.com',
        phone: '7654321000',
        vehicleType: 'bike',
        city: 'Coimbatore',
        vehicleNumber: 'TN-37-AB-1234',
        status: 'approved',
        isAvailable: true,
        documents: { drivingLicense: 'DL-12345', idProof: 'AADHAAR-XXXX', vehicleRC: 'RC-12345', verified: true },
        totalDeliveries: 567,
        rating: 4.7,
        earnings: 145600,
      },
      {
        name: 'Suresh Yadav',
        email: 'suresh@delivery.com',
        phone: '7654321001',
        vehicleType: 'scooter',
        city: 'Trichy',
        vehicleNumber: 'TN-45-CD-5678',
        status: 'approved',
        isAvailable: true,
        documents: { drivingLicense: 'DL-23456', idProof: 'AADHAAR-YYYY', vehicleRC: 'RC-23456', verified: true },
        totalDeliveries: 423,
        rating: 4.5,
        earnings: 112300,
      },
      {
        name: 'Mohammed Irfan',
        email: 'irfan@delivery.com',
        phone: '7654321002',
        vehicleType: 'bike',
        city: 'Theni',
        vehicleNumber: 'TN-60-EF-9012',
        status: 'approved',
        isAvailable: true,
        documents: { drivingLicense: 'DL-34567', idProof: 'AADHAAR-ZZZZ', vehicleRC: 'RC-34567', verified: true },
        totalDeliveries: 0,
        rating: 0,
        earnings: 0,
      },
      {
        name: 'Arun Prasad',
        email: 'arun@delivery.com',
        phone: '7654321003',
        vehicleType: 'car',
        city: 'Coimbatore',
        vehicleNumber: 'TN-38-GH-3456',
        status: 'approved',
        isAvailable: true,
        documents: { drivingLicense: 'DL-45678', idProof: 'AADHAAR-WWWW', vehicleRC: 'RC-45678', verified: true },
        totalDeliveries: 234,
        rating: 4.8,
        earnings: 89700,
      },
      {
        name: 'Deepak Sharma',
        email: 'deepak@delivery.com',
        phone: '7654321004',
        vehicleType: 'bike',
        city: 'Chennai',
        vehicleNumber: 'TN-01-IJ-7890',
        status: 'approved',
        isAvailable: true,
        documents: { drivingLicense: 'DL-56789', idProof: 'AADHAAR-VVVV', vehicleRC: 'RC-56789', verified: true },
        totalDeliveries: 156,
        rating: 3.1,
        earnings: 34500,
      },
      {
        name: 'Naveen Patil',
        email: 'naveen@delivery.com',
        phone: '7654321005',
        vehicleType: 'scooter',
        city: 'Salem',
        vehicleNumber: 'TN-30-KL-2345',
        status: 'approved',
        isAvailable: true,
        documents: { drivingLicense: 'DL-67890', idProof: 'AADHAAR-UUUU', vehicleRC: 'RC-67890', verified: true },
        totalDeliveries: 0,
        rating: 0,
        earnings: 0,
      },
    ]);
    console.log(`🚴 ${deliveryPartners.length} Delivery Partners created`);

    // Create Orders
    const statuses = ['placed', 'preparing', 'ready', 'picked', 'delivered', 'cancelled'];
    const paymentStatuses = ['pending', 'paid', 'refunded'];
    const paymentMethods = ['cod', 'online', 'wallet'];
    const items = [
      [{ name: 'Butter Chicken', quantity: 2, price: 280 }, { name: 'Naan', quantity: 4, price: 40 }],
      [{ name: 'Masala Dosa', quantity: 3, price: 120 }, { name: 'Filter Coffee', quantity: 3, price: 50 }],
      [{ name: 'Hyderabadi Biryani', quantity: 1, price: 350 }, { name: 'Raita', quantity: 1, price: 60 }],
      [{ name: 'Paneer Tikka', quantity: 2, price: 220 }, { name: 'Rumali Roti', quantity: 4, price: 30 }],
      [{ name: 'Fish Curry', quantity: 1, price: 380 }, { name: 'Appam', quantity: 4, price: 35 }],
      [{ name: 'Chole Bhature', quantity: 2, price: 150 }, { name: 'Lassi', quantity: 2, price: 70 }],
      [{ name: 'Pasta Arrabiata', quantity: 2, price: 260 }, { name: 'Garlic Bread', quantity: 1, price: 120 }],
      [{ name: 'Thali Meal', quantity: 1, price: 250 }],
    ];

    const approvedCooks = homeCooks.filter(hc => hc.status === 'approved');
    const approvedPartners = deliveryPartners.filter(dp => dp.status === 'approved');
    const activeCustomers = customers.filter(c => c.status === 'active');

    const orders = [];
    for (let i = 0; i < 50; i++) {
      const orderItems = items[Math.floor(Math.random() * items.length)];
      const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 180));

      orders.push({
        orderNumber: `CK-${String(i + 1).padStart(6, '0')}`,
        customerId: activeCustomers[Math.floor(Math.random() * activeCustomers.length)]._id,
        homeCookId: approvedCooks[Math.floor(Math.random() * approvedCooks.length)]._id,
        deliveryPartnerId: status === 'picked' || status === 'delivered'
          ? approvedPartners[Math.floor(Math.random() * approvedPartners.length)]._id
          : null,
        items: orderItems,
        totalAmount,
        status,
        paymentStatus: status === 'delivered' ? 'paid' : (status === 'cancelled' ? 'refunded' : paymentStatuses[Math.floor(Math.random() * 2)]),
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        deliveryAddress: { street: '123 Main St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
        createdAt: orderDate,
      });
    }

    await Order.insertMany(orders);
    console.log(`📦 ${orders.length} Orders created`);

    // Create Menu Items
    const menuItems = [
      // Priya Sharma - North Indian
      { name: 'Butter Chicken', description: 'Creamy tomato-based curry with tender chicken pieces, finished with butter and cream', price: 280, category: 'main-course', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: false, rating: 4.9, preparationTime: '35 mins', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400' },
      { name: 'Paneer Tikka', description: 'Marinated paneer cubes grilled in tandoor with bell peppers and onions', price: 220, category: 'starters', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: true, rating: 4.7, preparationTime: '25 mins', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400' },
      { name: 'Dal Makhani', description: 'Slow-cooked black lentils in rich buttery gravy, simmered overnight', price: 180, category: 'main-course', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: true, rating: 4.8, preparationTime: '40 mins', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400' },
      { name: 'Tandoori Roti', description: 'Whole wheat flatbread baked in clay tandoor', price: 30, category: 'breads', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: true, rating: 4.5, preparationTime: '10 mins', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' },
      { name: 'Chicken Biryani', description: 'Fragrant basmati rice layered with spiced chicken and saffron', price: 320, category: 'biryani', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: false, rating: 4.9, preparationTime: '45 mins', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400' },
      // Lakshmi Devi - South Indian
      { name: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potato masala, served with sambar and chutney', price: 120, category: 'main-course', cuisine: 'South Indian', homeCookId: homeCooks[1]._id, isVeg: true, rating: 4.8, preparationTime: '20 mins', image: 'https://images.unsplash.com/photo-1668236543090-82eb5eab6fee?w=400' },
      { name: 'Idli Sambar', description: 'Steamed rice cakes served with lentil soup and coconut chutney', price: 80, category: 'snacks', cuisine: 'South Indian', homeCookId: homeCooks[1]._id, isVeg: true, rating: 4.6, preparationTime: '15 mins', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400' },
      { name: 'Chettinad Chicken', description: 'Fiery chicken curry with freshly ground Chettinad spices', price: 290, category: 'main-course', cuisine: 'South Indian', homeCookId: homeCooks[1]._id, isVeg: false, rating: 4.7, preparationTime: '40 mins', image: 'https://images.unsplash.com/photo-1610057099443-fde6c99db9e1?w=400' },
      { name: 'Filter Coffee', description: 'Traditional South Indian coffee brewed with chicory blend', price: 50, category: 'beverages', cuisine: 'South Indian', homeCookId: homeCooks[1]._id, isVeg: true, rating: 4.9, preparationTime: '5 mins', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400' },
      { name: 'Medu Vada', description: 'Crispy lentil doughnuts served with sambar and chutney', price: 70, category: 'snacks', cuisine: 'South Indian', homeCookId: homeCooks[1]._id, isVeg: true, rating: 4.5, preparationTime: '20 mins', image: 'https://images.unsplash.com/photo-1630383249896-42fa17e2a726?w=400' },
      // Meera Krishnan - Continental/Italian
      { name: 'Pasta Arrabiata', description: 'Penne pasta in spicy tomato sauce with garlic and red chili flakes', price: 260, category: 'main-course', cuisine: 'Italian', homeCookId: homeCooks[3]._id, isVeg: true, rating: 4.8, preparationTime: '25 mins', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
      { name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil', price: 350, category: 'main-course', cuisine: 'Italian', homeCookId: homeCooks[3]._id, isVeg: true, rating: 4.9, preparationTime: '30 mins', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
      { name: 'Garlic Bread', description: 'Toasted bread with garlic butter, herbs, and melted cheese', price: 120, category: 'starters', cuisine: 'Italian', homeCookId: homeCooks[3]._id, isVeg: true, rating: 4.6, preparationTime: '15 mins', image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400' },
      { name: 'Caesar Salad', description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan', price: 180, category: 'starters', cuisine: 'Continental', homeCookId: homeCooks[3]._id, isVeg: true, rating: 4.4, preparationTime: '10 mins', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400' },
      // Fatima Khan - Hyderabadi
      { name: 'Hyderabadi Dum Biryani', description: 'Authentic slow-cooked biryani with fragrant spices and tender meat', price: 350, category: 'biryani', cuisine: 'Hyderabadi', homeCookId: homeCooks[4]._id, isVeg: false, rating: 4.9, preparationTime: '50 mins', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400' },
      { name: 'Haleem', description: 'Rich slow-cooked stew of meat, lentils, and pounded wheat', price: 250, category: 'main-course', cuisine: 'Hyderabadi', homeCookId: homeCooks[4]._id, isVeg: false, rating: 4.8, preparationTime: '45 mins', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400' },
      { name: 'Seekh Kebab', description: 'Minced meat kebabs seasoned with aromatic spices, grilled to perfection', price: 280, category: 'starters', cuisine: 'Hyderabadi', homeCookId: homeCooks[4]._id, isVeg: false, rating: 4.7, preparationTime: '30 mins', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400' },
      { name: 'Double Ka Meetha', description: 'Traditional Hyderabadi bread pudding with saffron and dry fruits', price: 150, category: 'desserts', cuisine: 'Hyderabadi', homeCookId: homeCooks[4]._id, isVeg: true, rating: 4.6, preparationTime: '20 mins', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400' },
      // Kavitha Nair - Kerala
      { name: 'Kerala Fish Curry', description: 'Tangy and spicy fish curry cooked in coconut and tamarind gravy', price: 380, category: 'main-course', cuisine: 'Kerala', homeCookId: homeCooks[7]._id, isVeg: false, rating: 4.8, preparationTime: '35 mins', image: 'https://images.unsplash.com/photo-1626500155537-99deade30106?w=400' },
      { name: 'Appam with Stew', description: 'Lacy rice pancakes with aromatic vegetable or chicken stew', price: 160, category: 'main-course', cuisine: 'Kerala', homeCookId: homeCooks[7]._id, isVeg: true, rating: 4.7, preparationTime: '25 mins', image: 'https://images.unsplash.com/photo-1630383249896-42fa17e2a726?w=400' },
      { name: 'Payasam', description: 'Traditional Kerala dessert made with vermicelli, milk, and jaggery', price: 100, category: 'desserts', cuisine: 'Kerala', homeCookId: homeCooks[7]._id, isVeg: true, rating: 4.6, preparationTime: '20 mins', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400' },
      { name: 'Puttu & Kadala Curry', description: 'Steamed rice cake cylinders with spiced black chickpea curry', price: 110, category: 'main-course', cuisine: 'Kerala', homeCookId: homeCooks[7]._id, isVeg: true, rating: 4.5, preparationTime: '25 mins', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400' },
      // More items across cooks
      { name: 'Chole Bhature', description: 'Spicy chickpea curry with fluffy deep-fried bread', price: 150, category: 'main-course', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: true, rating: 4.7, preparationTime: '30 mins', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400' },
      { name: 'Gulab Jamun', description: 'Deep-fried milk solids dumplings soaked in rose-flavored sugar syrup', price: 80, category: 'desserts', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: true, rating: 4.8, preparationTime: '15 mins', image: 'https://images.unsplash.com/photo-1666190094768-15a0630a4c5e?w=400' },
      { name: 'Mango Lassi', description: 'Refreshing yogurt smoothie blended with Alphonso mango pulp', price: 90, category: 'beverages', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: true, rating: 4.6, preparationTime: '5 mins', image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400' },
      { name: 'Veg Thali', description: 'Complete meal with dal, sabzi, roti, rice, raita, salad, and sweet', price: 250, category: 'thali', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: true, rating: 4.9, preparationTime: '40 mins', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400' },
      { name: 'Non-Veg Thali', description: 'Full meal with chicken curry, dal, roti, rice, raita, and dessert', price: 350, category: 'thali', cuisine: 'North Indian', homeCookId: homeCooks[0]._id, isVeg: false, rating: 4.8, preparationTime: '45 mins', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400' },
      { name: 'Rava Dosa', description: 'Crispy semolina crepe with onions and green chillies', price: 100, category: 'snacks', cuisine: 'South Indian', homeCookId: homeCooks[1]._id, isVeg: true, rating: 4.5, preparationTime: '15 mins', image: 'https://images.unsplash.com/photo-1630383249896-42fa17e2a726?w=400' },
      { name: 'Tiramisu', description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', price: 220, category: 'desserts', cuisine: 'Italian', homeCookId: homeCooks[3]._id, isVeg: true, rating: 4.7, preparationTime: '15 mins', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
      { name: 'Veg Biryani', description: 'Fragrant basmati rice with mixed vegetables and aromatic spices', price: 220, category: 'biryani', cuisine: 'Hyderabadi', homeCookId: homeCooks[4]._id, isVeg: true, rating: 4.6, preparationTime: '40 mins', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400' },
    ];

    await MenuItem.insertMany(menuItems);
    console.log(`🍽️  ${menuItems.length} Menu Items created`);

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin Login: admin@cloudkitchen.com');
    console.log('  Password:    admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
