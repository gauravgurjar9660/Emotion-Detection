import os
import pickle 
import re
import numpy as np
from fastapi import FastAPI,HTTPException
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.models import Sequential
from pydantic import BaseModel,Field
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
from keras.models import load_model
from fastapi.responses import FileResponse
from tensorflow.keras.preprocessing.sequence import pad_sequences
 # Here we make structure for deployment
'''
1.load data

3.max_samples
4. emotion labels
5.emotion emojies
'''
model_path='Articale/bigru_model.keras'

tokens_path='Articale/tokenizer.pkl'

max_samples=50

emotion_labels=['sadness', 'joy', 'love', 'anger', 'fear', 'surprise']

emotion_emojis={
    'sadness':'😞','joy':'😀','love':'❤️','anger':'🤬','fear':'😨','surprise':'😲'}

# Here Now We DO TEXT CLEANING
'''
1.unwanted text
2.remove extra space
3.lower case
4.punchation
'''
def clean_text(text : str):
    text= text.lower()
    text=re.sub(r"'",'',text)
    text=re.sub(r'[^a-z0-9\s]','',text)
    text=re.sub(r'\s+',' ',text).strip()
    return text


'''
Here we can do some things of excetuion
1.input text
2.response text
3.health response(service activation report)
'''
class InputText(BaseModel):
    text:str = Field(...,min_length=1,max_length=4000,json_schema_extra={'example':'I Feel so good at that time'},description='Enter the words ')

class OutputText(BaseModel):
    confidence: float
    text : str
    emotion_prediction:str
    allprediction : dict[str,float]

class HealthResponse(BaseModel):
    model_loaded:bool
    status : str

dl_model={}

@asynccontextmanager
async def load_data(app:FastAPI):
    print("Data is Loading ....")
    dl_model['model']=load_model(model_path)

    with open(tokens_path,'rb') as file:
        dl_model['tokenizer']=pickle.load(file)

    print("Your Model is loading successfully")
    
    yield
    dl_model.clear()

app=FastAPI(
    lifespan=load_data)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount('/static', StaticFiles(directory="static"), name="static")

# Here We check server ui
@app.get("/",include_in_schema=False)
def server():
    return FileResponse('static/index.html')

# Here We can make health server
@app.get("/health",response_model=HealthResponse)
def health_check():
    return HealthResponse(status='Model is Running Currently',model_loaded=bool(dl_model))

@app.post("/predict",response_model=OutputText)

def predict(text_data:InputText):
    model=dl_model.get('model')
    tokens=dl_model.get('tokenizer')
    if model is None or tokens is None:
        raise HTTPException(status_code=502,detail="Your model and tokens are not loaded properly")
    preprocess=clean_text(text_data.text)

    tokenize=tokens.texts_to_sequences([preprocess])

    padding=pad_sequences(
        tokenize,
        maxlen=max_samples,
        padding='post',
        truncating='post'
    )
    prediction=model.predict(padding)[0]
    top_emotion=int(np.argmax(prediction))
    all_possiblity={
        label : float(pred) for label,pred in zip(emotion_labels,prediction)
    }
    
    return OutputText(
        text =text_data.text,
        allprediction=all_possiblity,
        confidence= float(prediction[top_emotion]),
        emotion_prediction  = emotion_labels[top_emotion]
    )
     
    
    # emoji: str add karo aur return mein emoji=emotion_emojis[emotion_labels[top_emotion]]

    

