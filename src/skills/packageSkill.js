import JSZip from "jszip";

/**
 * Package a SKILL.md string into a downloadable .skill zip file.
 *
 * @param {string} skillContent - The complete SKILL.md content
 * @param {string} skillName - Folder/file name (default: 'learning-style')
 * @returns {Promise<void>} Triggers browser download
 */
export async function downloadSkill(skillContent, skillName = "learning-style") {
  const zip = new JSZip();
  const folder = zip.folder(skillName);
  folder.file("SKILL.md", skillContent);
  const blob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${skillName}.skill`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
