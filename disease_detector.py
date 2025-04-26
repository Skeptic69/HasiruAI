from typing import List, Dict, Any
from google.cloud import vision
import numpy as np
from collections import defaultdict
import logging

# Configure logging
logger = logging.getLogger(__name__)

class DiseaseDetector:
    def __init__(self):
        # Knowledge base of common plant diseases with improved detection patterns
        self.disease_database = {
            'leaf_blight': {
                'keywords': ['brown', 'spots', 'wilting', 'dry', 'necrosis', 'lesion', 'blight'],
                'color_ranges': [(139, 69, 19), (165, 42, 42), (101, 67, 33)],  # Brown shades
                'texture_patterns': ['spotted', 'irregular', 'necrotic'],
                'symptoms': 'Brown spots on leaves, wilting, and dry patches with dark borders',
                'treatment': 'Remove infected leaves, improve air circulation, apply fungicide if necessary',
                'prevention': 'Maintain proper spacing between plants, avoid overhead watering, ensure good drainage'
            },
            'powdery_mildew': {
                'keywords': ['white', 'powder', 'spots', 'fungal', 'mildew', 'dusty'],
                'color_ranges': [(245, 245, 245), (255, 255, 255), (240, 240, 240)],  # White shades
                'texture_patterns': ['powdery', 'dusty', 'fuzzy'],
                'symptoms': 'White powdery coating on leaves and stems, yellowing of affected areas',
                'treatment': 'Apply fungicide, remove heavily infected parts, increase air circulation',
                'prevention': 'Improve air circulation, avoid overhead watering, plant resistant varieties'
            },
            'leaf_rust': {
                'keywords': ['rust', 'orange', 'spots', 'fungal', 'pustules', 'spores'],
                'color_ranges': [(255, 140, 0), (255, 69, 0), (204, 85, 0)],  # Orange/rust shades
                'texture_patterns': ['pustules', 'raised', 'powdery'],
                'symptoms': 'Orange-brown pustules on leaves, premature leaf drop, yellow spots',
                'treatment': 'Apply fungicide, remove infected plant debris, improve air circulation',
                'prevention': 'Plant resistant varieties, maintain proper plant spacing, avoid wet leaves'
            },
            'mosaic_virus': {
                'keywords': ['mosaic', 'mottled', 'yellow', 'pattern', 'virus'],
                'color_ranges': [(255, 255, 0), (173, 255, 47), (154, 205, 50)],  # Yellow-green shades
                'texture_patterns': ['mottled', 'streaked', 'patterned'],
                'symptoms': 'Mottled pattern of light and dark green/yellow areas on leaves',
                'treatment': 'Remove and destroy infected plants, control insect vectors',
                'prevention': 'Use virus-resistant varieties, control insects, maintain plant hygiene'
            }
        }

    def analyze(self, labels: List[Dict], objects: List[Dict], colors: List[Dict]) -> Dict[str, Any]:
        try:
            # Log input data
            logger.info(f'Starting disease analysis with {len(labels)} labels, {len(objects)} objects, and {len(colors)} color profiles')
            
            # Extract relevant information from Vision API results
            label_descriptions = [label.description.lower() for label in labels]
            confidence_scores = [label.score for label in labels]
            
            # Log detected labels
            logger.debug(f'Detected labels: {label_descriptions}')
            
            # Check if the image is of a plant
            plant_keywords = ['plant', 'leaf', 'tree', 'flower', 'fruit', 'vegetation', 'foliage']
            plant_matches = [keyword for keyword in plant_keywords if any(keyword in desc for desc in label_descriptions)]
            
            if not plant_matches:
                logger.warning('No plant detected in the image')
                raise ValueError('No plant detected in the image. Please upload a clear image of a plant.')
            
            # Initialize weighted scoring system
            disease_scores = defaultdict(float)
            weights = {
                'label_match': 0.4,    # Weight for matching disease keywords
                'color_match': 0.3,    # Weight for matching disease colors
                'texture_match': 0.3,  # Weight for matching texture patterns
            }
            logger.debug(f'Initialized scoring system with weights: {weights}')
        except Exception as e:
            logger.error(f'Error in disease analysis initialization: {str(e)}')
            raise

        # Analyze labels with improved confidence scoring
        for disease, info in self.disease_database.items():
            # Keyword matching with confidence weighting
            for keyword in info['keywords']:
                matches = [i for i, desc in enumerate(label_descriptions) if keyword in desc]
                for idx in matches:
                    disease_scores[disease] += confidence_scores[idx] * weights['label_match']

            # Texture pattern matching from Vision API labels
            for pattern in info['texture_patterns']:
                if any(pattern in desc for desc in label_descriptions):
                    disease_scores[disease] += weights['texture_match']

        # Enhanced color analysis with weighted color ranges
        dominant_colors = [(int(color.color.red), int(color.color.green), int(color.color.blue)) 
                          for color in colors]
        color_scores = [color.score for color in colors]  # Use color scores from Vision API
        
        for disease, info in self.disease_database.items():
            for target_color in info['color_ranges']:
                for dom_color, color_score in zip(dominant_colors, color_scores):
                    color_distance = self._color_distance(target_color, dom_color)
                    if color_distance < 100:  # Threshold for color similarity
                        # Weight color matching by both color prominence and similarity
                        similarity_factor = 1 - (color_distance / 100)
                        disease_scores[disease] += weights['color_match'] * similarity_factor * color_score

        # Enhanced disease detection logic
        if not any(disease_scores.values()):
            logger.info('No disease patterns detected, plant appears healthy')
            return {
                'disease': {
                    'name': 'Healthy',
                    'confidence': 0.90,
                    'symptoms': 'No visible symptoms of disease',
                    'treatment': 'Continue regular plant care',
                    'prevention': 'Maintain good plant health through proper watering, fertilization, and pest monitoring'
                }
            }

        # Sort diseases by score to get top matches
        sorted_diseases = sorted(disease_scores.items(), key=lambda x: x[1], reverse=True)
        primary_disease = sorted_diseases[0]
        disease_name = primary_disease[0]
        
        # Calculate normalized confidence score
        max_possible_score = sum(weights.values())  # Maximum theoretical score
        confidence = min(primary_disease[1] / max_possible_score, 0.95)  # Normalize confidence
        
        logger.info(f'Detected disease: {disease_name} with confidence: {confidence:.2%}')
        logger.debug(f'All disease scores: {dict(sorted_diseases)}')
        
        # If confidence is too low, return as potentially healthy
        if confidence < 0.4:
            return {
                'disease': {
                    'name': 'Potentially Healthy',
                    'confidence': 0.75,
                    'symptoms': 'No clear disease symptoms detected',
                    'treatment': 'Monitor plant health closely',
                    'prevention': 'Continue regular plant care and monitoring'
                }
            }

        return {
            'disease': {
                'name': disease_name.replace('_', ' ').title(),
                'confidence': confidence,
                'symptoms': self.disease_database[disease_name]['symptoms'],
                'treatment': self.disease_database[disease_name]['treatment'],
                'prevention': self.disease_database[disease_name]['prevention']
            }
        }

    def _color_distance(self, color1: tuple, color2: tuple) -> float:
        """Calculate Euclidean distance between two RGB colors"""
        return np.sqrt(sum((a - b) ** 2 for a, b in zip(color1, color2)))
