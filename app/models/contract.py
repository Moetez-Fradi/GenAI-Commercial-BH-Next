from sqlalchemy import Column, BigInteger, Text, Float
from app.db.base import Base

class Contract(Base):
    __tablename__ = "contracts"

    index = Column(BigInteger, primary_key=True, nullable=False)  # matches your DDL
    REF_PERSONNE = Column(BigInteger, nullable=True)
    NUM_CONTRAT = Column(BigInteger, nullable=True)
    LIB_PRODUIT = Column(Text, nullable=True)
    EFFET_CONTRAT = Column(Text, nullable=True)
    DATE_EXPIRATION = Column(Text, nullable=True)  # stored as text in DB
    PROCHAIN_TERME = Column(Text, nullable=True)
    LIB_ETAT_CONTRAT = Column(Text, nullable=True)
    branche = Column(Text, nullable=True)
    somme_quittances = Column(Float, nullable=True)
    statut_paiement = Column(Text, nullable=True)
    Capital_assure = Column(Float, nullable=True)

    # convenience property (not persisted) - parse DATE_EXPIRATION to datetime when possible
    @property
    def expiration_as_datetime(self):
        from datetime import datetime
        from dateutil import parser as _parser

        if not self.DATE_EXPIRATION:
            return None

        try:
            return _parser.parse(self.DATE_EXPIRATION)
        except Exception:
            # fallback attempts
            for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%d-%m-%Y"):
                try:
                    return datetime.strptime(self.DATE_EXPIRATION, fmt)
                except Exception:
                    continue
        return None