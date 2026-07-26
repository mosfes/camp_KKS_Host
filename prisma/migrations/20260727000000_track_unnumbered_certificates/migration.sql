-- Allow a certificate issuance to be tracked even when the camp does not use
-- running certificate numbers.
ALTER TABLE `certificate` MODIFY `certificate_no` INTEGER NULL;
ALTER TABLE `certificate` MODIFY `certificate_no_star` INTEGER NULL;
