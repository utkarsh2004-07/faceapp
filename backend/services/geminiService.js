const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    // Define colors to avoid and their replacements
    this.colorReplacements = {
      // Burgundy/Wine colors - replace with black/white combinations
      '#800020': '#000000', // Burgundy -> Black
      '#722f37': '#ffffff', // Dark wine -> White
      '#8b0000': '#000000', // Dark red -> Black
      '#a0522d': '#2f2f2f', // Sienna -> Dark gray
      '#b22222': '#000000', // Fire brick -> Black

      // Other problematic colors
      '#ff0000': '#000000', // Pure red -> Black
      '#dc143c': '#ffffff', // Crimson -> White
      '#8b008b': '#000000', // Dark magenta -> Black
    };

    // Alternative black/white/gray combinations for shoes
    this.shoeColorAlternatives = [
      { color: 'Black Leather', hex: '#000000', reason: 'Classic and versatile choice that pairs well with any outfit' },
      { color: 'White Sneakers', hex: '#ffffff', reason: 'Fresh and modern look that adds brightness to the outfit' },
      { color: 'Charcoal Gray', hex: '#36454f', reason: 'Sophisticated neutral that complements most color combinations' },
      { color: 'Black and White', hex: '#000000', reason: 'Timeless two-tone combination that adds visual interest' },
      { color: 'Off-White', hex: '#f8f8ff', reason: 'Softer alternative to pure white that works with most outfits' },
      { color: 'Dark Gray', hex: '#2f2f2f', reason: 'Modern neutral that bridges black and white beautifully' }
    ];

    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.warn('⚠️  Gemini API key not configured. Color recommendations will use fallback logic.');
      this.isConfigured = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      this.isConfigured = true;
      console.log('✅ Gemini AI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI service:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Get clothing color recommendations based on face analysis data
   * @param {Object} faceAnalysisData - Face analysis results
   * @param {Object} userProfile - User profile information (gender, preferences)
   * @returns {Promise<Object>} Color recommendations for shirt, pants, and shoes
   */
  async getColorRecommendations(faceAnalysisData, userProfile = {}) {
    if (!this.isConfigured) {
      console.log('🔄 Using fallback color recommendations (Gemini not configured)');
      return this.getFallbackRecommendations(faceAnalysisData, userProfile);
    }

    try {
      const prompt = this.buildColorRecommendationPrompt(faceAnalysisData, userProfile);
      
      console.log('🤖 Sending request to Gemini AI for color recommendations...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Received response from Gemini AI');
      
      // Parse the AI response
      const recommendations = this.parseGeminiResponse(text);

      // Filter and replace unwanted colors
      const filteredRecommendations = this.filterAndReplaceColors(recommendations);

      // Validate and enhance the recommendations
      return this.validateAndEnhanceRecommendations(filteredRecommendations, faceAnalysisData);
      
    } catch (error) {
      console.error('❌ Error getting Gemini recommendations:', error.message);
      console.log('🔄 Falling back to default recommendations');
      return this.getFallbackRecommendations(faceAnalysisData, userProfile);
    }
  }

  /**
   * Build a detailed prompt for Gemini AI
   */
  buildColorRecommendationPrompt(faceAnalysisData, userProfile) {
    const { colors, facialFeatures, confidence } = faceAnalysisData;
    const gender = userProfile.gender || 'unspecified';

    // Check if we have meaningful face analysis data
    const hasValidData = colors && (
      (colors.skinTone?.primary && colors.skinTone.primary !== 'unknown') ||
      (colors.hairColor?.primary && colors.hairColor.primary !== 'unknown') ||
      (colors.eyeColor?.primary && colors.eyeColor.primary !== 'unknown') ||
      (facialFeatures?.faceShape && facialFeatures.faceShape !== 'unknown')
    );

    // Extract specific values for the prompt
    const skinTone = colors?.skinTone?.primary || 'not detected';
    const skinToneHex = colors?.skinTone?.hex || 'not available';
    const hairColor = colors?.hairColor?.primary || 'not detected';
    const hairColorHex = colors?.hairColor?.hex || 'not available';
    const eyeColor = colors?.eyeColor?.primary || 'not detected';
    const eyeColorHex = colors?.eyeColor?.hex || 'not available';
    const lipColor = colors?.lipColor?.primary || 'not detected';
    const lipColorHex = colors?.lipColor?.hex || 'not available';
    const faceShape = facialFeatures?.faceShape || 'not determined';
    const confidencePercent = confidence ? (confidence * 100).toFixed(1) + '%' : 'not available';

    // Extract facial features
    const eyeShape = facialFeatures?.eyeShape || 'not determined';
    const eyeDistance = facialFeatures?.eyeDistance || 'not determined';
    const eyebrowShape = facialFeatures?.eyebrowShape || 'not determined';
    const noseShape = facialFeatures?.noseShape || 'not determined';
    const lipShape = facialFeatures?.lipShape || 'not determined';

    // Extract face dimensions (if available)
    const faceDimensions = faceAnalysisData.faceDimensions || {};
    const faceLength = faceDimensions.faceLength ? `${faceDimensions.faceLength}px` : 'not measured';
    const faceWidth = faceDimensions.faceWidth ? `${faceDimensions.faceWidth}px` : 'not measured';
    const lengthToWidthRatio = faceDimensions.lengthToWidthRatio ? faceDimensions.lengthToWidthRatio.toFixed(2) : 'not calculated';
    const jawWidth = faceDimensions.jawWidth ? `${faceDimensions.jawWidth}px` : 'not measured';
    const foreheadWidth = faceDimensions.foreheadWidth ? `${faceDimensions.foreheadWidth}px` : 'not measured';
    const cheekboneWidth = faceDimensions.cheekboneWidth ? `${faceDimensions.cheekboneWidth}px` : 'not measured';







    const prompt = `
You are an expert fashion color analyst and stylist trained in seasonal color theory, color harmony, facial proportion matching, and clothing aesthetics.

Your task is to generate 3 complete and visually appealing outfit combinations tailored specifically to a user based on their detailed facial analysis and color features.

---

FACE ANALYSIS DATA:

COLOR PROFILE:
- Skin Tone: ${skinTone} (Hex: ${skinToneHex})
- Hair Color: ${hairColor} (Hex: ${hairColorHex})
- Eye Color: ${eyeColor} (Hex: ${eyeColorHex})
- Lip Color: ${lipColor} (Hex: ${lipColorHex})

FACIAL FEATURES:
- Face Shape: ${faceShape}
- Eye Shape: ${eyeShape}
- Eye Distance: ${eyeDistance}
- Eyebrow Shape: ${eyebrowShape}
- Nose Shape: ${noseShape}
- Lip Shape: ${lipShape}

PROPORTIONS & STRUCTURE:
- Face Length: ${faceLength}, Width: ${faceWidth}, Ratio: ${lengthToWidthRatio}
- Jaw Width: ${jawWidth}, Forehead Width: ${foreheadWidth}, Cheekbone Width: ${cheekboneWidth}

PERSONAL DETAILS:
- Gender: ${gender}
- Confidence in Face Analysis: ${confidencePercent}%
- Data Quality: ${hasValidData ? "High-quality (detailed)" : "Low-quality (basic)"}

---

OBJECTIVE:
- Use the above face data to generate 3 personalized outfit color combinations (shirt, pants, shoes).
- Consider seasonal color analysis, contrast levels, warm vs cool tones, and color psychology.
- Adapt choices based on:
  - ${skinTone} skin tone
  - ${hairColor} hair color
  - ${eyeColor} eye color
  - ${faceShape} face shape
  - Facial balance and proportions

---

REQUIREMENTS:

1. Provide 3 complete outfit suggestions:
   - Each must include: shirt, pants, and shoes
   - Use real color names (e.g. "Olive Green") and valid hex codes

2. Include a brief reason for each item explaining:
   - Why this color was chosen based on the user’s features
   - How it works with their natural tones and proportions

3. Avoid repeating colors across all outfits. Each outfit should be visually distinct.

4. Include a seasonalType (Spring, Summer, Autumn, Winter, Universal)

5. Return all output in the exact JSON format shown below.

---

SHOE COLOR RESTRICTIONS:
Avoid these hex values for shoes:
["#800020", "#722f37", "#8b0000", "#a0522d", "#b22222", "#ff0000", "#dc143c", "#8b008b"]

Preferred shoe colors:
["#000000", "#ffffff", "#36454f", "#2f2f2f", "#f8f8ff"]

---

OUTPUT FORMAT:

{
  "recommendations": [
    {
      "outfitName": "Unique outfit name here",
      "shirt": {
        "color": "Color Name",
        "hex": "#xxxxxx",
        "reason": "Explain why this shirt color complements skin tone (${skinTone}), hair (${hairColor}), and face shape (${faceShape})"
      },
      "pants": {
        "color": "Color Name",
        "hex": "#xxxxxx",
        "reason": "Explain how it balances proportions or contrasts with shirt"
      },
      "shoes": {
        "color": "Color Name",
        "hex": "#xxxxxx",
        "reason": "Explain its versatility and grounding effect on the outfit"
      },
      "overallReason": "Summarize how this outfit enhances natural features and fits the user's facial structure"
    }
    // Repeat for outfit 2 and 3
  ],
  "colorPalette": {
    "bestColors": [/* 3-6 top hex codes */],
    "avoidColors": [/* 2-4 specific hex codes */],
    "seasonalType": "Spring" // or Summer, Autumn, Winter, Universal
  },
  "generalAdvice": "Explain the overall strategy based on ${skinTone}, ${hairColor}, ${eyeColor}, and ${faceShape}, and how these outfits were chosen to enhance them."
}

---

CRITICAL:
- Don’t copy color combos from previous responses.
- Never use "Navy + Khaki + Black" in all responses.
- Think like a human stylist: create visually distinct, well-balanced, seasonal looks.

Use fashion theory and user features. Be creative and precise.
`;


    return prompt;
  }

  /**
   * Filter and replace unwanted colors in recommendations
   */
  filterAndReplaceColors(recommendations) {
    if (!recommendations.recommendations || !Array.isArray(recommendations.recommendations)) {
      return recommendations;
    }

    console.log('🎨 Filtering unwanted colors...');

    recommendations.recommendations = recommendations.recommendations.map((outfit, index) => {
      const filteredOutfit = { ...outfit };

      // Check and replace shoe colors specifically
      if (outfit.shoes && outfit.shoes.hex) {
        const shoeHex = outfit.shoes.hex.toLowerCase();

        // Check if shoe color should be replaced
        if (this.colorReplacements[shoeHex] || this.shouldReplaceColor(shoeHex)) {
          const alternativeShoe = this.getAlternativeShoeColor(index);

          console.log(`   🔄 Replacing shoe color ${outfit.shoes.color} (${outfit.shoes.hex}) with ${alternativeShoe.color} (${alternativeShoe.hex})`);

          filteredOutfit.shoes = {
            color: alternativeShoe.color,
            hex: alternativeShoe.hex,
            reason: alternativeShoe.reason
          };
        }
      }

      // Check and replace other problematic colors in shirt/pants if needed
      ['shirt', 'pants'].forEach(item => {
        if (outfit[item] && outfit[item].hex) {
          const itemHex = outfit[item].hex.toLowerCase();
          if (this.colorReplacements[itemHex]) {
            const replacementHex = this.colorReplacements[itemHex];
            const replacementColor = replacementHex === '#000000' ? 'Black' :
                                   replacementHex === '#ffffff' ? 'White' : 'Dark Gray';

            console.log(`   🔄 Replacing ${item} color ${outfit[item].color} (${outfit[item].hex}) with ${replacementColor} (${replacementHex})`);

            filteredOutfit[item] = {
              ...outfit[item],
              color: replacementColor,
              hex: replacementHex,
              reason: `Classic ${replacementColor.toLowerCase()} that complements your features and works well with the overall outfit`
            };
          }
        }
      });

      return filteredOutfit;
    });

    // Also filter color palette
    if (recommendations.colorPalette) {
      if (recommendations.colorPalette.bestColors) {
        recommendations.colorPalette.bestColors = recommendations.colorPalette.bestColors.map(color => {
          const lowerColor = color.toLowerCase();
          return this.colorReplacements[lowerColor] || color;
        });
      }

      if (recommendations.colorPalette.avoidColors) {
        // Add the unwanted colors to avoid list
        const unwantedColors = Object.keys(this.colorReplacements);
        recommendations.colorPalette.avoidColors = [
          ...new Set([...recommendations.colorPalette.avoidColors, ...unwantedColors])
        ];
      }
    }

    return recommendations;
  }

  /**
   * Check if a color should be replaced based on similarity to unwanted colors
   */
  shouldReplaceColor(hex) {
    // Check for burgundy/wine-like colors (red with low brightness)
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substr(0, 2), 16);
      const g = parseInt(cleanHex.substr(2, 2), 16);
      const b = parseInt(cleanHex.substr(4, 2), 16);

      // Detect burgundy-like colors (high red, low green/blue)
      if (r > 100 && g < 50 && b < 50) {
        return true;
      }

      // Detect very bright reds
      if (r > 200 && g < 100 && b < 100) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get alternative shoe color based on outfit index for variety
   */
  getAlternativeShoeColor(outfitIndex) {
    const alternatives = this.shoeColorAlternatives;
    return alternatives[outfitIndex % alternatives.length];
  }

  /**
   * Parse Gemini AI response and extract recommendations
   */
  parseGeminiResponse(responseText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return parsed;
      }
      
      // If no JSON found, return fallback
      throw new Error('No valid JSON found in response');
      
    } catch (error) {
      console.error('Error parsing Gemini response:', error.message);
      console.log('Raw response:', responseText.substring(0, 500) + '...');
      
      // Return a structured fallback based on the response text
      return this.extractRecommendationsFromText(responseText);
    }
  }

  /**
   * Extract recommendations from unstructured text response
   */
  extractRecommendationsFromText(text) {
    // This is a fallback parser for when Gemini doesn't return proper JSON
    return {
      recommendations: [
        {
          outfitName: "AI Suggested Combination",
          shirt: {
            color: "Navy Blue",
            hex: "#1e3a8a",
            reason: "Versatile and flattering for most skin tones"
          },
          pants: {
            color: "Charcoal Gray",
            hex: "#36454f",
            reason: "Classic neutral that pairs well with navy"
          },
          shoes: {
            color: "Brown Leather",
            hex: "#8b4513",
            reason: "Adds warmth and completes the look"
          },
          overallReason: "Classic combination based on AI analysis"
        }
      ],
      colorPalette: {
        bestColors: ["#1e3a8a", "#36454f", "#8b4513"],
        avoidColors: ["#ff0000", "#ffff00"],
        seasonalType: "Universal"
      },
      generalAdvice: "Based on your features, these colors should complement your natural coloring."
    };
  }

  /**
   * Validate and enhance AI recommendations
   */
  validateAndEnhanceRecommendations(recommendations, faceAnalysisData) {
    // Ensure we have the required structure
    if (!recommendations.recommendations || !Array.isArray(recommendations.recommendations)) {
      return this.getFallbackRecommendations(faceAnalysisData);
    }

    // Validate each recommendation has required fields
    recommendations.recommendations = recommendations.recommendations.map(rec => {
      return {
        outfitName: rec.outfitName || 'Recommended Outfit',
        shirt: {
          color: rec.shirt?.color || 'Navy Blue',
          hex: this.validateHexColor(rec.shirt?.hex) || '#1e3a8a',
          reason: rec.shirt?.reason || 'Complements your features'
        },
        pants: {
          color: rec.pants?.color || 'Charcoal Gray',
          hex: this.validateHexColor(rec.pants?.hex) || '#36454f',
          reason: rec.pants?.reason || 'Versatile neutral tone'
        },
        shoes: {
          color: rec.shoes?.color || 'Brown Leather',
          hex: this.validateHexColor(rec.shoes?.hex) || '#8b4513',
          reason: rec.shoes?.reason || 'Completes the outfit'
        },
        overallReason: rec.overallReason || 'Balanced color combination'
      };
    });

    // Ensure we have color palette with valid seasonal type
    if (!recommendations.colorPalette) {
      recommendations.colorPalette = {
        bestColors: recommendations.recommendations.flatMap(rec => [rec.shirt.hex, rec.pants.hex, rec.shoes.hex]),
        avoidColors: ['#ff0000', '#ffff00'],
        seasonalType: 'Universal'
      };
    } else {
      // Validate and fix seasonal type
      recommendations.colorPalette.seasonalType = this.validateSeasonalType(recommendations.colorPalette.seasonalType);

      // Validate hex colors in palette
      if (recommendations.colorPalette.bestColors) {
        recommendations.colorPalette.bestColors = recommendations.colorPalette.bestColors
          .map(color => this.validateHexColor(color))
          .filter(Boolean);
      }

      if (recommendations.colorPalette.avoidColors) {
        recommendations.colorPalette.avoidColors = recommendations.colorPalette.avoidColors
          .map(color => this.validateHexColor(color))
          .filter(Boolean);
      }
    }

    return recommendations;
  }

  /**
   * Validate hex color format
   */
  validateHexColor(hex) {
    if (!hex || typeof hex !== 'string') return null;

    // Remove # if present and validate format
    const cleanHex = hex.replace('#', '');
    if (/^[0-9A-F]{6}$/i.test(cleanHex)) {
      return '#' + cleanHex.toLowerCase();
    }

    return null;
  }

  /**
   * Validate seasonal type against allowed enum values
   */
  validateSeasonalType(seasonalType) {
    const validTypes = ['Spring', 'Summer', 'Autumn', 'Winter', 'Universal', 'Unspecified'];

    if (!seasonalType || typeof seasonalType !== 'string') {
      return 'Universal';
    }

    // Check if it's a valid type (case insensitive)
    const normalizedType = seasonalType.trim();
    const matchedType = validTypes.find(type =>
      type.toLowerCase() === normalizedType.toLowerCase()
    );

    if (matchedType) {
      return matchedType;
    }

    // Check for partial matches or common variations
    const lowerType = normalizedType.toLowerCase();
    if (lowerType.includes('spring')) return 'Spring';
    if (lowerType.includes('summer')) return 'Summer';
    if (lowerType.includes('autumn') || lowerType.includes('fall')) return 'Autumn';
    if (lowerType.includes('winter')) return 'Winter';
    if (lowerType.includes('unspecified') || lowerType.includes('unknown')) return 'Unspecified';

    // Default fallback
    return 'Universal';
  }

  /**
   * Fallback recommendations when AI is not available
   */
  getFallbackRecommendations(faceAnalysisData, userProfile = {}) {
    const { colors } = faceAnalysisData;
    const skinTone = colors?.skinTone?.primary || 'medium';
    const hairColor = colors?.hairColor?.primary || 'brown';
    
    // Basic color theory recommendations
    const recommendations = {
      recommendations: [
        {
          outfitName: "Classic Professional",
          shirt: {
            color: "Crisp White",
            hex: "#ffffff",
            reason: "Universal color that works with all skin tones"
          },
          pants: {
            color: "Navy Blue",
            hex: "#1e3a8a",
            reason: "Professional and flattering for most people"
          },
          shoes: {
            color: "Black Leather",
            hex: "#000000",
            reason: "Classic choice for professional settings"
          },
          overallReason: "Timeless combination suitable for professional environments"
        },
        {
          outfitName: "Casual Weekend",
          shirt: {
            color: "Light Blue",
            hex: "#87ceeb",
            reason: "Soft color that complements most skin tones"
          },
          pants: {
            color: "Khaki",
            hex: "#c3b091",
            reason: "Relaxed neutral perfect for casual wear"
          },
          shoes: {
            color: "White Sneakers",
            hex: "#f8f8ff",
            reason: "Fresh and modern for casual outfits"
          },
          overallReason: "Comfortable and stylish for everyday wear"
        },
        {
          outfitName: "Evening Smart Casual",
          shirt: {
            color: "Charcoal Gray",
            hex: "#36454f",
            reason: "Sophisticated neutral that works well in evening settings"
          },
          pants: {
            color: "Dark Denim",
            hex: "#1c2951",
            reason: "Versatile and stylish for smart casual occasions"
          },
          shoes: {
            color: "Black Leather",
            hex: "#000000",
            reason: "Classic and versatile choice that adds sophistication"
          },
          overallReason: "Perfect balance of casual and refined"
        }
      ],
      colorPalette: {
        bestColors: ["#ffffff", "#1e3a8a", "#87ceeb", "#c3b091", "#36454f"],
        avoidColors: ["#ff0000", "#ffff00", "#ff00ff"],
        seasonalType: "Universal"
      },
      generalAdvice: `Based on your ${skinTone} skin tone and ${hairColor} hair, these classic combinations will complement your natural features. Consider adding accessories in accent colors to personalize your look.`
    };

    return recommendations;
  }

  /**
   * Test the Gemini service connection
   */
  async testConnection() {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Gemini API not configured',
        configured: false
      };
    }

    try {
      const result = await this.model.generateContent('Hello, please respond with "Gemini AI is working correctly"');
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        message: 'Gemini AI connection successful',
        response: text,
        configured: true
      };
    } catch (error) {
      return {
        success: false,
        message: `Gemini AI connection failed: ${error.message}`,
        configured: true
      };
    }
  }
}

module.exports = new GeminiService();
