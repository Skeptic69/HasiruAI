from flask import Flask, request, jsonify, send_from_directory, send_file
from google.cloud import vision
import os
from disease_detector import DiseaseDetector
from flask_cors import CORS
from werkzeug.utils import secure_filename
import logging
import traceback
from datetime import datetime

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/')
def root():
    return send_file('index.html')

@app.route('/pages/<path:filename>')
def serve_pages(filename):
    return send_from_directory('pages', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('js', filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('css', filename)

# Configure upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Configure error responses
def error_response(message, status_code=400, details=None):
    response = {
        'error': message,
        'timestamp': datetime.utcnow().isoformat()
    }
    if details:
        response['details'] = details
    return jsonify(response), status_code

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image(file):
    """Validate the uploaded image file"""
    if not file:
        raise ValueError('No file provided')
    
    if not file.filename:
        raise ValueError('No filename in request')
        
    if not allowed_file(file.filename):
        raise ValueError(f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}')
    
    return True

# Initialize the Google Cloud Vision client with error handling
try:
    credentials_path = os.path.join(os.path.dirname(__file__), 'credentials', 'service-account-key.json')
    if not os.path.exists(credentials_path):
        raise FileNotFoundError(f'Credentials file not found at {credentials_path}')
    client = vision.ImageAnnotatorClient.from_service_account_file(credentials_path)
    logger.info('Successfully initialized Google Cloud Vision client')
except Exception as e:
    logger.error(f'Failed to initialize Google Cloud Vision client: {str(e)}')
    raise

# Initialize our custom disease detector
disease_detector = DiseaseDetector()
logger.info('Disease detector initialized successfully')

# Enable CORS for the specific endpoint
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST')
    return response

@app.route('/api/detect-disease', methods=['POST'])
def detect_disease():
    try:
        logger.info('Received disease detection request')
        logger.debug(f'Request files: {request.files}')
        logger.debug(f'Request headers: {request.headers}')
        
        # Get the image file
        image_file = request.files.get('image')
        logger.info(f'Received image file: {image_file.filename}')
        
        if not image_file or not image_file.filename:
            logger.error('No selected image file')
            return error_response('No selected image file')
        
        try:
            validate_image(image_file)
        except ValueError as e:
            logger.warning(f'Image validation failed: {str(e)}')
            return error_response(str(e))

        try:
            # Process the image file
            filename = secure_filename(image_file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            # Save and process the file with proper cleanup
            try:
                image_file.save(filepath)
                with open(filepath, 'rb') as f:
                    content = f.read()
            finally:
                # Ensure file cleanup happens even if processing fails
                if os.path.exists(filepath):
                    os.remove(filepath)
            
            # Prepare Vision API requests
            image = vision.Image(content=content)
            features = [
                vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION, max_results=20),
                vision.Feature(type_=vision.Feature.Type.OBJECT_LOCALIZATION),
                vision.Feature(type_=vision.Feature.Type.IMAGE_PROPERTIES)
            ]
            
            # Batch API request for efficiency
            request = vision.AnnotateImageRequest(image=image, features=features)
            response = client.annotate_image(request=request)
            
            if response.error.message:
                raise Exception(response.error.message)
            
            # Extract annotations
            labels = response.label_annotations
            objects = response.localized_object_annotations
            image_properties = response.image_properties_annotation
            
            # Log analysis progress
            logger.info(f'Analyzing image: {filename}')
            logger.info(f'Found {len(labels)} labels, {len(objects)} objects')
            
            try:
                # Analyze the image using our custom detector
                result = disease_detector.analyze(
                    labels=labels,
                    objects=objects,
                    colors=image_properties.dominant_colors.colors
                )
                
                # Log analysis completion
                disease_name = result.get('disease', {}).get('name', 'No disease found')
                logger.info(f'Analysis complete: {disease_name}')
                
                return jsonify({
                    'status': 'success',
                    'timestamp': datetime.utcnow().isoformat(),
                    'result': result
                })
            except Exception as analyze_error:
                logger.error(f'Error in disease analysis: {str(analyze_error)}\n{traceback.format_exc()}')
                return error_response('Error analyzing disease patterns', 500, str(analyze_error))
            
        except Exception as e:
            logger.error(f'Error processing image: {str(e)}\n{traceback.format_exc()}')
            return error_response('Error processing image', 500, str(e))
            
    except Exception as e:
        logger.error(f'Unexpected error: {str(e)}\n{traceback.format_exc()}')
        return error_response('An unexpected error occurred', 500)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
