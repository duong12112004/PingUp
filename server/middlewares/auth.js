
export const protect = async (req, res, next) => {
    try {
        // Giả sử bạn lấy userId từ Clerk hoặc JWT, ví dụ:
        // const { userId } = await someAuthFunction(req);
        // Ở đây giữ nguyên cách lấy như cũ:
        const { userId } = await req.auth();
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }
        req.userId = userId; // Gán userId vào request
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}