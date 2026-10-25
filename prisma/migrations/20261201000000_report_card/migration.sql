-- Report card details from the school's paper card: State of Origin, Resumption, ratings and the Supervisor's comment.
-- Only adds empty columns, so existing data is untouched.

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "stateOfOrigin" TEXT;

-- AlterTable
ALTER TABLE "StudentTermSummary" ADD COLUMN     "ratings" JSONB,
ADD COLUMN     "supervisorRemark" TEXT;

-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "resumptionDate" TIMESTAMP(3);

