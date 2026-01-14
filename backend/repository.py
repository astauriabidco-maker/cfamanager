from sqlalchemy.orm import Session
from typing import Type, TypeVar, List, Generic
from database import Base

T = TypeVar("T", bound=Base)

class BaseRepository(Generic[T]):
    def __init__(self, db: Session, model: Type[T], tenant_id: int):
        self.db = db
        self.model = model
        self.tenant_id = tenant_id

    def get_all(self) -> List[T]:
        # STRICT ISOLATION: Always filter by tenant_id
        return self.db.query(self.model).filter(self.model.tenant_id == self.tenant_id).all()

    def get_by_id(self, id: int) -> T:
        return self.db.query(self.model).filter(
            self.model.id == id, 
            self.model.tenant_id == self.tenant_id
        ).first()

# Helper dependency to get a repository for a specific model context
class UserRepository(BaseRepository[T]):
    pass 
