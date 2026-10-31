/*
 Navicat Premium Dump SQL

 Source Server         : TCS-TIDB
 Source Server Type    : TiDB
 Source Server Version : 80011 (8.0.11-TiDB-v8.5.3-serverless)
 Source Host           : gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000
 Source Schema         : tcsmaindb

 Target Server Type    : TiDB
 Target Server Version : 80011 (8.0.11-TiDB-v8.5.3-serverless)
 File Encoding         : 65001

 Date: 31/10/2026 19:15:21
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for combos
-- ----------------------------
DROP TABLE IF EXISTS `combos`;
CREATE TABLE `combos`  (
  `combo_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `combo_items` json NOT NULL,
  `discount_pct` decimal(5, 2) NOT NULL,
  `active` tinyint(1) NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`combo_id`) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of combos
-- ----------------------------
INSERT INTO `combos` VALUES ('combo_biryani_juice', 'Chicken Biryani + Fresh Juice', '[\"item_biryani\", \"item_fresh_juice\"]', 15.00, 1, '2026-10-29 06:49:29');
INSERT INTO `combos` VALUES ('combo_dosa_coffee', 'Dosa + Cold Coffee', '[\"item_dosa\", \"item_cold_coffee\"]', 12.00, 1, '2026-10-29 06:49:29');
INSERT INTO `combos` VALUES ('combo_meals_tea', 'Veg Meals + Special Chai', '[\"item_veg_meals\", \"item_tea\"]', 10.00, 1, '2026-10-29 06:49:28');

-- ----------------------------
-- Table structure for guardrails
-- ----------------------------
DROP TABLE IF EXISTS `guardrails`;
CREATE TABLE `guardrails`  (
  `id` int NOT NULL DEFAULT 1,
  `margin_floor_pct` decimal(5, 2) NOT NULL DEFAULT 20.00,
  `max_weekly_change_pct` decimal(5, 2) NOT NULL DEFAULT 15.00,
  `student_price_cap` decimal(10, 2) NOT NULL DEFAULT 100.00,
  `coverage_target` decimal(5, 4) NOT NULL DEFAULT 0.7500,
  `combo_discount_cap_pct` decimal(5, 2) NOT NULL DEFAULT 20.00,
  `fairness_mode` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of guardrails
-- ----------------------------
INSERT INTO `guardrails` VALUES (1, 20.00, 15.00, 100.00, 0.7500, 20.00, 1, '2026-10-29 06:49:25');

-- ----------------------------
-- Table structure for menu_items
-- ----------------------------
DROP TABLE IF EXISTS `menu_items`;
CREATE TABLE `menu_items`  (
  `item_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `kind` enum('main','addon') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `price` decimal(10, 2) NOT NULL,
  `cost` decimal(10, 2) NOT NULL,
  `portion_size_g` int NOT NULL,
  `units_per_day` decimal(10, 2) NOT NULL,
  `flags` json NULL,
  `portion_tiers` json NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of menu_items
-- ----------------------------
INSERT INTO `menu_items` VALUES ('item_biryani', 'Chicken Biryani', 'main', 90.00, 96.00, 400, 70.00, '[\"loss_maker\"]', '[{\"portion_size_g\": 400, \"price\": 90, \"tier\": \"regular\"}, {\"portion_size_g\": 220, \"price\": 55, \"tier\": \"half\"}]', '2026-10-29 06:49:25', '2026-10-29 06:49:25');
INSERT INTO `menu_items` VALUES ('item_cold_coffee', 'Cold Coffee', 'addon', 35.00, 15.00, 250, 85.00, '[]', '[{\"portion_size_g\": 250, \"price\": 35, \"tier\": \"regular\"}]', '2026-10-29 06:49:27', '2026-10-29 06:49:27');
INSERT INTO `menu_items` VALUES ('item_dosa', 'Masala Dosa', 'main', 40.00, 24.00, 250, 180.00, '[\"star\"]', '[{\"portion_size_g\": 250, \"price\": 40, \"tier\": \"single\"}, {\"portion_size_g\": 450, \"price\": 70, \"tier\": \"double\"}]', '2026-10-29 06:49:26', '2026-10-29 06:49:26');
INSERT INTO `menu_items` VALUES ('item_fresh_juice', 'Fresh Fruit Juice', 'addon', 45.00, 30.00, 300, 10.00, '[\"poor_seller\"]', '[{\"portion_size_g\": 300, \"price\": 45, \"tier\": \"regular\"}]', '2026-10-29 06:49:26', '2026-10-29 06:49:26');
INSERT INTO `menu_items` VALUES ('item_paneer_roll', 'Paneer Roll', 'main', 55.00, 57.00, 200, 40.00, '[\"loss_maker\"]', '[{\"portion_size_g\": 200, \"price\": 55, \"tier\": \"regular\"}]', '2026-10-29 06:49:25', '2026-10-29 06:49:25');
INSERT INTO `menu_items` VALUES ('item_salad', 'Salad Bowl', 'main', 65.00, 45.00, 280, 10.00, '[\"poor_seller\"]', '[{\"portion_size_g\": 280, \"price\": 65, \"tier\": \"regular\"}]', '2026-10-29 06:49:26', '2026-10-29 06:49:26');
INSERT INTO `menu_items` VALUES ('item_tea', 'Special Chai', 'addon', 15.00, 5.00, 150, 260.00, '[\"star\"]', '[{\"portion_size_g\": 150, \"price\": 15, \"tier\": \"regular\"}]', '2026-10-29 06:49:27', '2026-10-29 06:49:27');
INSERT INTO `menu_items` VALUES ('item_veg_meals', 'Veg Full Meals', 'main', 70.00, 45.00, 500, 120.00, '[]', '[{\"portion_size_g\": 300, \"price\": 45, \"tier\": \"mini\"}, {\"portion_size_g\": 500, \"price\": 70, \"tier\": \"standard\"}]', '2026-10-29 06:49:26', '2026-10-29 06:49:26');

-- ----------------------------
-- Table structure for override_logs
-- ----------------------------
DROP TABLE IF EXISTS `override_logs`;
CREATE TABLE `override_logs`  (
  `override_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `rec_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `decision` enum('approve','edit','reject') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `edited_value` decimal(10, 2) NULL DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `decided_by` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'cafeteria_owner',
  `decided_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`override_id`) USING BTREE
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin;

-- ----------------------------
-- Records of override_logs
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
