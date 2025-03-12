-- AlterTable
ALTER TABLE `status` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `subtask` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `task` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `status` ADD CONSTRAINT `status_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task` ADD CONSTRAINT `task_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subtask` ADD CONSTRAINT `subtask_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
