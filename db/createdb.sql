DROP TABLE IF EXISTS `votes`;
DROP TABLE IF EXISTS `answers`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `users`;

--
-- Table structure for table `answers`
--

CREATE TABLE `answers` (
  `id` int(11) NOT NULL,
  `description` text NOT NULL,
  `questionid` int(11) NOT NULL,
  `position` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` int(11) NOT NULL,
  `question` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `type` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `admin` tinyint(1) NOT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `votes`
--

CREATE TABLE `votes` (
  `answerchoiceid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `questionid` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `answers`
--
ALTER TABLE `answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `questionid` (`questionid`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `username_2` (`username`),
  ADD KEY `lastname` (`lastname`);

--
-- Indexes for table `votes`
--
ALTER TABLE `votes`
  ADD PRIMARY KEY (`answerchoiceid`,`userid`,`questionid`),
  ADD KEY `vote_userid` (`userid`),
  ADD KEY `vote_answerchoice` (`questionid`,`answerchoiceid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `answers`
--
ALTER TABLE `answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `answers`
--
ALTER TABLE `answers`
  ADD CONSTRAINT `questionid` FOREIGN KEY (`questionid`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `votes`
--
ALTER TABLE `votes`
  ADD CONSTRAINT `vote_answerchoice` FOREIGN KEY (`questionid`,`answerchoiceid`) REFERENCES `answers` (`questionid`, `id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vote_questionid` FOREIGN KEY (`questionid`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vote_userid` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

