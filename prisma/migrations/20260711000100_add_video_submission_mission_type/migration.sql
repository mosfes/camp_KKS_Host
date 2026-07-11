-- Allow missions that collect a public video link. The link itself continues to
-- be stored in mission_answer_text, so no video files are stored by this app.
ALTER TABLE `mission`
  MODIFY `type` ENUM('QUESTION_ANSWERING', 'PHOTO_SUBMISSION', 'VIDEO_SUBMISSION', 'QR_CODE_SCANNING', 'MULTIPLE_CHOICE_QUIZ', 'PRE_TEST', 'POST_TEST') NOT NULL DEFAULT 'QUESTION_ANSWERING';
