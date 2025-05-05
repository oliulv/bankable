from database import engine
from models import Base

def init_db():
    Base.metadata.drop_all(bind=engine)  # Delete existing tables
    Base.metadata.create_all(bind=engine)  # Create new ones

if __name__ == "__main__":
    init_db()