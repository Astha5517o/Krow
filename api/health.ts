export default function handler(_req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ status: "ok", service: "Krow Kirana Backend", time: new Date().toISOString() });
}
