-- TripGalileo MySQL Database Dump
-- Compatible with phpMyAdmin Import

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `users`
-- superadmin password: 'superadmin'
-- admin password: 'admin@2026'
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `created_at`) VALUES
('u-1', 'superadmin', 'superadmin@gmail.com', '$2y$10$M/Z.TqUvH8r8V4h7pCq8e.f6n1u0w8y4p0q2m47H1oB11z19M1A1o', 'superadmin', NOW()),
('u-2', 'admin', 'admin@gmail.com', '$2y$10$F6B0yJvE1t19m1B11w12X.mGj7uXg4vY6.2m47H1oB11z19M1A1oK', 'admin', NOW()),
('u-3', 'vendor', 'vendor@tripgalileo.com', '$2y$10$F6B0yJvE1t19m1B11w12X.mGj7uXg4vY6.2m47H1oB11z19M1A1oK', 'vendor', NOW())
ON DUPLICATE KEY UPDATE id=id;

-- --------------------------------------------------------
-- Table structure for table `vendors`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `city` varchar(100) NOT NULL,
  `created_at` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `vendors`
INSERT INTO `vendors` (`id`, `name`, `email`, `phone`, `city`, `created_at`) VALUES
('vendor-1', 'Goa Premium Wheels Ltd', 'wheels@goa.com', '+91 9999988888', 'Calangute, Goa', CURDATE()),
('vendor-2', 'Breeze Rider Co', 'ride@goabreeze.com', '+91 9888877777', 'Vagator, Goa', CURDATE())
ON DUPLICATE KEY UPDATE id=id;

-- --------------------------------------------------------
-- Table structure for table `cars`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cars` (
  `id` varchar(50) NOT NULL,
  `vendor_id` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` int(11) NOT NULL,
  `seating` varchar(50) NOT NULL,
  `fuel` varchar(50) NOT NULL,
  `transmission` varchar(50) NOT NULL,
  `rating` decimal(3,2) DEFAULT '4.80',
  `badge` varchar(50) DEFAULT 'Popular',
  `image` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `cars_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- --------------------------------------------------------
-- Table structure for table `bikes`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bikes` (
  `id` varchar(50) NOT NULL,
  `vendor_id` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` int(11) NOT NULL,
  `engine` varchar(50) NOT NULL,
  `fuel` varchar(50) NOT NULL,
  `mileage` varchar(50) NOT NULL,
  `rating` decimal(3,2) DEFAULT '4.70',
  `badge` varchar(50) DEFAULT 'Popular',
  `image` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `bikes_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- --------------------------------------------------------
-- Table structure for table `hotels`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hotels` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `area` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `stars` int(11) NOT NULL,
  `amenities` text NOT NULL,
  `rating` decimal(3,2) DEFAULT '4.60',
  `badge` varchar(50) DEFAULT 'Premium',
  `image` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `hotels`
INSERT INTO `hotels` (`id`, `name`, `area`, `price`, `stars`, `amenities`, `rating`, `badge`, `image`) VALUES
('hotel-1', 'Taj Exotica Resort & Spa', 'South Goa (Benaulim)', 18000, 5, 'Private Beach, Infinity Pool, Luxury Spa, 24x7 Dining', '4.90', '5-Star Luxury', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'),
('hotel-2', 'W Goa', 'North Goa (Vagator)', 22000, 5, 'Rock Pool, Premium Club, Ocean View, Vibrant Vibe', '4.80', 'Ultra Premium', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'),
('hotel-3', 'Whispering Palms Beach Resort', 'North Goa (Candolim)', 7500, 4, 'Close to Beach, Swimming Pool, All-Inclusive Plan, Bar', '4.50', 'Best Family Choice', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'),
('hotel-4', 'Lemon Tree Amarante Beach Resort', 'North Goa (Candolim)', 6800, 4, 'Heritage Architecture, Spa, Poolside Bar, Wi-Fi', '4.40', 'Highly Rated', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'),
('hotel-5', 'Cidade de Goa - IHCL SeleQtions', 'Central Goa (Dona Paula)', 12500, 5, 'Oceanfront, Water Sports, Kids Play Area, Fine Dining', '4.70', 'Beachfront View', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80')
ON DUPLICATE KEY UPDATE id=id;

-- --------------------------------------------------------
-- Table structure for table `destinations`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `destinations` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `region` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `tag` varchar(255) NOT NULL,
  `image` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `destinations`
INSERT INTO `destinations` (`id`, `name`, `region`, `description`, `tag`, `image`) VALUES
('dest-1', 'Wow Goa', 'India', 'The ultimate beach paradise! Explore sandy shores, Portuguese heritage, open-air shacks, and active water sports.', 'Sun, Sand & Seafood', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80'),
('dest-2', 'Wow Dubai', 'Middle East', 'A futuristic oasis. Marvel at Burj Khalifa, shop at massive malls, enjoy desert safaris, and visit artificial islands.', 'Luxury & Skyline', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'),
('dest-3', 'Wow Europe', 'Europe', 'Breathtaking scenery and history! Wander through the streets of Paris, Venice, and Swiss Alps chalet pathways.', 'Heritage & Landscapes', 'https://images.unsplash.com/photo-1473951574080-01fe45ec8643?auto=format&fit=crop&w=800&q=80'),
('dest-4', 'Wow Maldives', 'Tropical Islands', 'Incredible water bungalows, transparent turquoise lagoons, colorful coral reefs, and romantic sunset cruises.', 'Private Luxury Residing', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80'),
('dest-5', 'Wow Bali', 'Asia', 'Lush green terraced rice paddies, serene volcanic mountains, iconic sea temples, and spiritual beach culture.', 'Nature & Spirituality', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'),
('dest-6', 'Wow Thailand', 'Asia', 'Vibrant street foods, ornate golden Buddhist shrines, busy night bazaars, and beautiful tropical islands like Phuket.', 'Culture & Nightlife', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80')
ON DUPLICATE KEY UPDATE id=id;

-- --------------------------------------------------------
-- Table structure for table `packages`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `packages` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `duration` varchar(100) NOT NULL,
  `car_included` varchar(255) NOT NULL,
  `hotel_included` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `description` text NOT NULL,
  `tag` varchar(100) DEFAULT 'Popular',
  `image` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table `packages`
INSERT INTO `packages` (`id`, `name`, `duration`, `car_included`, `hotel_included`, `price`, `description`, `tag`, `image`) VALUES
('package-1', 'Coastal Goa Explorer Pack', '4 Days / 3 Nights', 'Mahindra Thar 4x4', '4-Star Candolim Beach Resort', 14999, 'Explore the sun-kissed beaches of North Goa with a premium 4x4 Thar at your disposal and stays next to the lively coast.', 'Most Popular', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80'),
('package-2', 'Romantic Sunset Escape', '3 Days / 2 Nights', 'Audi Cabriolet Convertible', 'W Goa Luxury Resort (Vagator)', 29999, 'Drive in style under the open skies with a luxury convertible. Includes a candlelight beach dinner and a couples spa.', 'Luxury Honeymoon', 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80')
ON DUPLICATE KEY UPDATE id=id;

-- --------------------------------------------------------
-- Table structure for table `bookings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `license` varchar(100) DEFAULT NULL,
  `pickup_loc` varchar(255) NOT NULL,
  `pickup_date` varchar(50) NOT NULL,
  `pickup_time` varchar(50) NOT NULL,
  `drop_date` varchar(50) NOT NULL,
  `drop_time` varchar(50) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `booking_days` int(11) NOT NULL,
  `total_paid` int(11) NOT NULL,
-- --------------------------------------------------------
-- Table structure for table `leads`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leads` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT '',
  `source` varchar(100) DEFAULT 'Hotel Enquiries',
  `service` varchar(255) DEFAULT '',
  `assigned_to` varchar(100) DEFAULT 'Unassigned',
  `status` varchar(50) DEFAULT 'New',
  `budget` varchar(100) DEFAULT '',
  `notes` text DEFAULT NULL,
  `admin_id` varchar(50) DEFAULT 'admin',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `hotel_nearby_destinations`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hotel_nearby_destinations` (
  `id` varchar(50) NOT NULL,
  `hotel_id` varchar(50) NOT NULL,
  `destination_name` varchar(255) NOT NULL,
  `destination_category` varchar(100) NOT NULL,
  `distance_value` decimal(10,2) NOT NULL,
  `distance_unit` varchar(20) NOT NULL DEFAULT 'km',
  `distance_meters` int(11) NOT NULL,
  `travel_mode` varchar(50) NOT NULL DEFAULT 'Walking',
  `walking_time_minutes` int(11) DEFAULT NULL,
  `driving_time_minutes` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `approval_status` varchar(30) NOT NULL DEFAULT 'DRAFT',
  `rejection_reason` text DEFAULT NULL,
  `pending_changes` text DEFAULT NULL,
  `submitted_by` varchar(50) DEFAULT NULL,
  `approved_by` varchar(50) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hdest_hotel_id` (`hotel_id`),
  KEY `idx_hdest_approval` (`approval_status`),
  KEY `idx_hdest_category` (`destination_category`),
  KEY `idx_hdest_dist` (`distance_meters`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `hotel_destination_audit_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hotel_destination_audit_logs` (
  `id` varchar(50) NOT NULL,
  `destination_id` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `old_values` text DEFAULT NULL,
  `new_values` text DEFAULT NULL,
  `performed_by` varchar(50) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hdest_audit_dest` (`destination_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
