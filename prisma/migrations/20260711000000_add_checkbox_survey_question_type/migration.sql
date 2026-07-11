ALTER TABLE `survey_question`
  MODIFY `question_type` ENUM('scale', 'text', 'header', 'grid', 'checkbox') NOT NULL;

ALTER TABLE `survey_template_question`
  MODIFY `question_type` ENUM('scale', 'text', 'header', 'grid', 'checkbox') NOT NULL;
