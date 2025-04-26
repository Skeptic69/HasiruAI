const express = require('express');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const router = express.Router();

// Disease database
// Add synonyms for each disease
const diseaseDatabase = {
    'leaf blight': {
        synonyms: ['blight', 'leaf blight', 'brown blight'],
        symptoms: 'Leaf blight often starts as small, water-soaked lesions on the leaves that expand into large, irregular brown spots. Over time, affected leaves may yellow, wilt, and eventually die, leading to significant defoliation if not managed promptly.',
        causes: 'This disease is primarily caused by fungal pathogens such as Helminthosporium and Alternaria, which thrive in warm, humid conditions and can be spread by wind, rain, or contaminated tools.',
        treatment: '1. Remove and destroy all infected leaves and plant debris to reduce sources of infection. 2. Apply a copper-based fungicide thoroughly to all foliage, repeating every 7–10 days during wet weather. 3. Ensure proper plant spacing to improve air flow. 4. Water at the base of plants to keep leaves dry, as moisture encourages fungal growth. 5. Disinfect gardening tools after use. Both organic (neem oil, baking soda spray) and chemical (copper oxychloride) options are effective if used early.',
        prevention: 'Practice crop rotation and avoid planting susceptible crops in the same area for consecutive years. Always use disease-free seeds or seedlings. Mulch around plants to reduce soil splash, and avoid overhead watering.'
    },
    'powdery mildew': {
        synonyms: ['powdery mildew', 'mildew', 'white mildew'],
        symptoms: 'Powdery mildew appears as white or grayish powdery spots on the surfaces of leaves, stems, and sometimes flowers. Infected leaves may become distorted, turn yellow, and drop prematurely. Severe infections can stunt plant growth and reduce yields.',
        causes: 'This disease is caused by a group of fungi called Erysiphales, which thrive in warm, dry climates with high humidity at night. Crowded plantings and poor air circulation increase the risk.',
        treatment: '1. Prune and remove affected leaves to reduce the spread. 2. Spray plants with a solution of 1 tablespoon baking soda and 1/2 teaspoon liquid soap in 1 gallon of water as an organic remedy. 3. Apply sulfur-based or potassium bicarbonate fungicides according to label instructions for chemical control. 4. Increase sunlight exposure by thinning dense plantings. 5. Water early in the day to allow foliage to dry. Repeat treatments weekly until mildew subsides.',
        prevention: 'Choose resistant plant varieties when possible. Space plants to allow for good air movement. Avoid overhead watering, and keep garden areas free of weeds and debris.'
    },
    'leaf spot': {
        synonyms: ['leaf spot', 'spot', 'brown spot', 'cercospora'],
        symptoms: 'Leaf spot diseases cause dark, circular or angular spots on leaves, often surrounded by yellow halos. As the disease progresses, spots may merge, causing large dead areas and premature leaf drop.',
        causes: 'Leaf spots are caused by various fungi (such as Cercospora) and bacteria (such as Xanthomonas), which infect plants through wounds or natural openings, especially during wet, humid weather.',
        treatment: '1. Remove and dispose of infected leaves as soon as symptoms appear. 2. Avoid overhead watering to keep foliage dry. 3. Apply an appropriate fungicide (such as chlorothalonil or copper-based products) every 7–14 days. 4. For organic control, use neem oil or compost tea sprays. 5. Clean up fallen leaves and debris to prevent reinfection.',
        prevention: 'Water plants at the base and early in the day. Provide adequate spacing and prune to improve air circulation. Rotate crops and avoid planting the same species in the same spot each year.'
    },
    'root rot': {
        synonyms: ['root rot', 'rot', 'pythium', 'phytophthora'],
        symptoms: 'Plants affected by root rot exhibit wilting even when soil is moist, yellowing leaves, stunted growth, and roots that appear brown, mushy, or rotten when examined.',
        causes: 'Root rot is primarily caused by overwatering and poor soil drainage, which allow soil-borne fungi such as Pythium and Phytophthora to infect and destroy roots.',
        treatment: '1. Gently remove the plant from the soil and trim away all affected roots with sterilized scissors. 2. Repot or replant in fresh, well-draining soil. 3. Water sparingly until new growth appears. 4. Drench soil with a biological fungicide (such as Trichoderma) or a chemical fungicide labeled for root rot. 5. Use raised beds or amend heavy clay soils with compost and sand to improve drainage.',
        prevention: 'Always check soil moisture before watering. Use containers or beds with drainage holes. Avoid planting in low-lying, waterlogged areas.'
    },
    'bacterial wilt': {
        synonyms: ['bacterial wilt', 'wilt', 'ralstonia'],
        symptoms: 'Bacterial wilt causes sudden wilting of leaves, often starting with just a few leaves and quickly spreading to the whole plant. Stems may ooze a milky sap when cut, and the plant collapses rapidly.',
        causes: 'This disease is caused by the soil-borne bacterium Ralstonia solanacearum, which enters plants through roots or wounds and blocks water transport.',
        treatment: '1. Uproot and destroy infected plants immediately to prevent spread. 2. Solarize soil by covering it with clear plastic for 4–6 weeks during hot weather to kill bacteria. 3. Avoid moving soil or water from infected areas. 4. Disinfect tools and hands after working with affected plants. 5. There are no effective chemical controls, so prevention is key.',
        prevention: 'Plant resistant varieties if available. Use certified disease-free seeds and transplants. Rotate crops with non-host species for at least 2–3 years.'
    },
    'downy mildew': {
        synonyms: ['downy mildew', 'downy', 'oomycete'],
        symptoms: 'Downy mildew appears as yellow or pale green patches on the upper leaf surface, with white, gray, or purple fuzzy growth underneath. Leaves may curl, become distorted, and drop prematurely.',
        causes: 'It is caused by oomycete pathogens (fungal-like organisms) that thrive in cool, moist conditions and spread by wind and water.',
        treatment: '1. Remove and destroy affected leaves promptly. 2. Apply fungicides containing mancozeb or copper at the first sign of disease. 3. For organic control, use biofungicides or sprays of potassium bicarbonate. 4. Water early in the day to allow leaves to dry. 5. Increase air circulation by pruning and spacing plants.',
        prevention: 'Grow resistant varieties when possible. Avoid overhead irrigation and overcrowding. Clean up plant debris at season end.'
    },
    'anthracnose': {
        synonyms: ['anthracnose', 'colletotrichum', 'sunken lesions'],
        symptoms: 'Anthracnose causes dark, sunken lesions on leaves, stems, fruits, or flowers. Infected fruit may rot on the plant, and leaves may develop brown, dead spots with defined edges.',
        causes: 'This disease is caused by Colletotrichum fungi, which survive in plant debris and are spread by rain, irrigation, or contaminated tools.',
        treatment: '1. Prune and destroy all infected plant parts. 2. Apply fungicides such as chlorothalonil or copper-based sprays every 7–10 days during wet weather. 3. For organic control, use neem oil or biofungicides. 4. Avoid working among plants when foliage is wet. 5. Mulch to reduce soil splash.',
        prevention: 'Practice crop rotation and remove plant debris at the end of the season. Disinfect pruning tools regularly.'
    },
    'mosaic virus': {
        synonyms: ['mosaic virus', 'mosaic', 'virus', 'yellow mosaic'],
        symptoms: 'Mosaic virus causes leaves to develop a mottled pattern of light and dark green or yellow, often with distortion, curling, and stunted growth. Fruit may be deformed or fail to develop.',
        causes: 'This disease is caused by several types of viruses, which are commonly spread by insects such as aphids and whiteflies, or through infected seeds and tools.',
        treatment: '1. Remove and destroy infected plants immediately to prevent spread. 2. Control insect vectors by using yellow sticky traps or insecticidal soap. 3. Disinfect tools between uses. 4. There is no cure for viral infections, so focus on prevention and vector management.',
        prevention: 'Use only certified virus-free seeds and transplants. Control weeds that may harbor the virus. Rotate crops and control insect vectors diligently.'
    }
};

// Configure multer for handling file uploads
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    dest: 'uploads/'
});

// Create a client
const client = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, 'google-vision-key.json')
});

router.post('/detect', upload.single('image'), async (req, res) => {
    try {
        // Validate request
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded'
            });
        }

        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: 'Uploaded file is not an image'
            });
        }

        // Perform image analysis with Google Vision API
        const [result] = await client.labelDetection({
            image: { content: fs.readFileSync(req.file.path) }
        });

        const labels = result.labelAnnotations || [];
        
        // DEBUG: Log all labels for troubleshooting
        console.log('Detected labels:', labels.map(l => l.description + ' (' + l.score + ')').join(', '));
        // Loosen plant detection: accept if any label contains the keywords
        const keywords = ['plant', 'leaf', 'tree', 'flower', 'fruit'];
        const isPlant = labels.some(label =>
            keywords.some(kw => label.description.toLowerCase().includes(kw))
        );
        if (!isPlant) {
            return res.status(400).json({
                success: false,
                message: 'No plant detected in the image. Please upload a clear image of a plant.'
            });
        }

        // Use top 5 labels for better accuracy
        const topLabels = labels.slice(0, 5);
        let detectedDisease = 'Unknown condition';
        let bestScore = 0;
        let details = {
            symptoms: 'Visible plant damage or abnormal growth',
            causes: 'Unknown or mixed causes',
            treatment: 'Consult a local agricultural expert for specific treatment',
            prevention: 'Maintain good plant health through proper care and monitoring'
        };
        // Flexible/fuzzy matching: check all synonyms for each disease
        for (const label of topLabels) {
            for (const [disease, info] of Object.entries(diseaseDatabase)) {
                for (const synonym of info.synonyms || []) {
                    if (
                        label.description.toLowerCase().includes(synonym) ||
                        synonym.includes(label.description.toLowerCase())
                    ) {
                        if (label.score > bestScore) {
                            detectedDisease = disease;
                            bestScore = label.score;
                            details = info;
                        }
                    }
                }
            }
        }
        // If still no match, try partial match with any word in label/disease
        if (detectedDisease === 'Unknown condition') {
            for (const label of topLabels) {
                for (const [disease, info] of Object.entries(diseaseDatabase)) {
                    for (const synonym of info.synonyms || []) {
                        if (
                            label.description.toLowerCase().split(' ').some(word => synonym.includes(word)) ||
                            synonym.split(' ').some(word => label.description.toLowerCase().includes(word))
                        ) {
                            if (label.score > bestScore) {
                                detectedDisease = disease;
                                bestScore = label.score;
                                details = info;
                            }
                        }
                    }
                }
            }
        }
        // If still no match, use all top label descriptions for Gemini fallback
        if (detectedDisease === 'Unknown condition') {
            detectedDisease = topLabels.map(l => l.description).join(', ');
            bestScore = topLabels[0] ? topLabels[0].score : 0;
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Send response
        res.json({
            success: true,
            disease: detectedDisease,
            confidence: Math.round(bestScore * 100),
            symptoms: details.symptoms,
            causes: details.causes || '',
            treatment: details.treatment,
            prevention: details.prevention,
            labels: labels.map(l => ({ description: l.description, score: l.score }))
        });

    } catch (error) {
        console.error('Error:', error);
        // Clean up file if it exists
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error cleaning up file:', unlinkError);
            }
        }
        res.status(500).json({ 
            success: false,
            error: 'Failed to analyze image',
            message: error.message 
        });
    }
});

module.exports = router;
