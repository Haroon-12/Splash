import Replicate from "replicate";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

async function main() {
    try {
        console.log("Removing background...");
        // Use a generic model for background removal
        const output = await replicate.run(
            "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            { input: { image: "https://replicate.delivery/pbxt/H8S3vTjVl2JbYv0PxF0v2R0AOxW1M7a6T8R1b9a9Z1q7c0T/shoe.jpg" } } // dummy public image
        );
        console.log("Rembg output:", output);
    } catch (e) {
        console.log("Error:", e);
    }
}
main();
