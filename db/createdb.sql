-- Insert code to drop your other tables here
-- We must drop tables in this order to avoid foreign key constraints failing
-- for instance, we cannot drop users first because 'vote' has a foreign key
-- constraint on it.
-- 

DROP TABLE IF EXISTS `users`;

-- Similarly, tables need to be created in this order to ensure a table
-- exists when a foreign key constraint is added that refers to it.
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `admin` tinyint(1) NOT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `lastname` (`lastname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- Insert code to create the other tables you need
-- 
-- You may use phpMyAdmin to create the database, then save it, and extract the
-- SQL statements from there.
--

