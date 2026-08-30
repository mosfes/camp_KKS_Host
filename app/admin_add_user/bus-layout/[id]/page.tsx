import BusLayoutManager from "../../components/BusLayoutManager";

export default async function BusLayoutEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const templateId = Number(id);

  return (
    <div className="m-4 md:m-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดเลย์เอาท์รถ</h1>
        <p className="mt-1 text-sm text-gray-500">
          ลากที่นั่ง ประตู และห้องน้ำลงบนผัง แล้วบันทึกหรือเผยแพร่ให้หัวหน้าค่าย
        </p>
      </div>
      <BusLayoutManager
        mode="editor"
        templateId={Number.isInteger(templateId) ? templateId : undefined}
      />
    </div>
  );
}
