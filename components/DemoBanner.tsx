/** شريط «نسخة تجريبية» لما DEMO_MODE=true، عشان ما حدا يفكرها النظام الحقيقي */
export function DemoBanner() {
  if (process.env.DEMO_MODE !== "true") return null;
  return (
    <div className="demo-banner" role="note">
      نسخة تجريبية ببيانات وهمية بالكامل، وكل ما يُسجَّل فيها لأغراض التجربة فقط.
    </div>
  );
}
