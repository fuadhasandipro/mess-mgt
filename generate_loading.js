const fs = require('fs');
const path = require('path');

const templateDash = `import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
export default function Loading() { return <LoadingSkeleton type="dashboard" />; }`;

const templateList = `import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
export default function Loading() { return <LoadingSkeleton type="list" />; }`;

const dirsDash = ['app/(app)/dashboard'];
const dirsList = ['app/(app)/meals', 'app/(app)/finance', 'app/(app)/members', 'app/(app)/activity-log', 'app/(app)/manager', 'app/(app)/profile'];

dirsDash.forEach(dir => {
  fs.writeFileSync(path.join(__dirname, dir, 'loading.tsx'), templateDash);
});

dirsList.forEach(dir => {
  fs.writeFileSync(path.join(__dirname, dir, 'loading.tsx'), templateList);
});

console.log('Loading files created successfully');
