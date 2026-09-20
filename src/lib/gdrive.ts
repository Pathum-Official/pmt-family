import { Resource } from './types';

// Mocked Google Drive API functions for resources
export async function getDriveFiles(cohortId: string): Promise<Resource[]> {
  console.log(`Fetching Drive files for cohort: ${cohortId}`);
  // Return mocked data
  return [
    {
      id: "mock-res-1",
      title: "Lecture 1: Introduction to Mechanics",
      moduleCode: "PHY101",
      subject: "Physics",
      driveFileId: "mock-drive-id-1",
      driveViewUrl: "https://example.com/view/1",
      cohortId,
      category: "notes"
    },
    {
      id: "mock-res-2",
      title: "2022 Past Paper",
      moduleCode: "MAT102",
      subject: "Mathematics",
      driveFileId: "mock-drive-id-2",
      driveViewUrl: "https://example.com/view/2",
      cohortId,
      category: "past_papers"
    }
  ];
}

export async function uploadToDrive(file: File, cohortId: string): Promise<string> {
  console.log(`Mock uploading ${file.name} to Drive for cohort ${cohortId}`);
  return `mock-uploaded-drive-id-${Date.now()}`;
}
