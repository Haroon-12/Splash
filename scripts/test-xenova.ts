import { generateEmbedding, cosineSimilarity } from '../src/lib/embeddings';

async function main() {
    console.log("Loading xenova and generating embeddings...");

    const emb1 = await generateEmbedding("fashion and style");
    const emb2 = await generateEmbedding("streetwear");
    const emb3 = await generateEmbedding("gaming and computers");

    const sim1 = cosineSimilarity(emb1, emb2);
    const sim2 = cosineSimilarity(emb1, emb3);

    console.log("Similarity (fashion vs streetwear):", sim1);
    console.log("Similarity (fashion vs gaming):", sim2);

    console.log("Test complete.");
}

main().catch(console.error);
