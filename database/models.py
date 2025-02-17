from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from database import Base
import enum

Base = declarative_base()

class ProductType(enum.Enum):
    PERSONAL_CURRENT = "Personal Current Account"
    SAVINGS = "Savings"
    CREDIT = "Credit Card"
    OVERDRAFT = "Overdraft"

class Product(Base):
    __tablename__ = 'product'
    
    product_id = Column(String, primary_key=True)
    product_name = Column(String, nullable=False)
    product_type = Column(Enum(ProductType), nullable=False)
    product_benefits = Column(String)

    # Polymorphic configuration
    __mapper_args__ = {
        'polymorphic_on': product_type,
        'polymorphic_identity': 'product'  # or just "base"
    }

    # Relationships
    accounts = relationship("Account", back_populates="product")


class PersonalCurrentAccount(Product):
    __tablename__ = 'personal_current_account'
    
    # Primary key references product.product_id
    product_id = Column(
        String,
        ForeignKey('product.product_id'),
        primary_key=True
    )
    
    # Fields specific to Personal Current Accounts
    interest_rate = Column(Float)
    monthly_fee = Column(Float)
    min_monthly_deposit = Column(Float)

    __mapper_args__ = {
        'polymorphic_identity': ProductType.PERSONAL_CURRENT
    }


class SavingsAccount(Product):
    __tablename__ = 'savings_account'
    
    product_id = Column(
        String,
        ForeignKey('product.product_id'),
        primary_key=True
    )

    # Fields specific to Savings
    interest_rate = Column(Float)
    min_monthly_deposit = Column(Float)
    max_monthly_deposit = Column(Float)
    max_yearly_withdrawal = Column(Float)
    max_withdrawal_limit = Column(Float)
    
    __mapper_args__ = {
        'polymorphic_identity': ProductType.SAVINGS
    }


class CreditCard(Product):
    __tablename__ = 'credit_card'
    
    product_id = Column(
        String,
        ForeignKey('product.product_id'),
        primary_key=True
    )
    
    # Fields specific to Credit Cards
    interest_rate = Column(Float)
    monthly_fee = Column(Float)
    credit_limit = Column(Float)
    
    __mapper_args__ = {
        'polymorphic_identity': ProductType.CREDIT
    }


class Overdraft(Product):
    __tablename__ = 'overdraft'
    
    product_id = Column(
        String,
        ForeignKey('product.product_id'),
        primary_key=True
    )
    
    # Fields specific to Overdrafts
    daily_interest_rate = Column(Float)
    interest_free_overdraft_limit = Column(Float)
    interest_free_buffer = Column(Float)
    
    __mapper_args__ = {
        'polymorphic_identity': ProductType.OVERDRAFT
    }


class Customer(Base):
    __tablename__ = 'customer'
    
    customer_id = Column(String, primary_key=True)
    title = Column(String)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    nationality = Column(String)
    dob = Column(DateTime)
    address = Column(String)
    city = Column(String)
    postcode = Column(String)
    monthly_income = Column(Float)
    marital_status = Column(String)

    accounts = relationship("Account", back_populates="customer")
    interactions = relationship("Interaction", back_populates="customer")


class Account(Base):
    __tablename__ = 'account'

    customer_id = Column(String, ForeignKey('customer.customer_id'), nullable=False)
    product_id = Column(String, ForeignKey('product.product_id'), nullable=False)
    account_id = Column(String, primary_key=True)
    starting_balance = Column(Float)
    since = Column(DateTime, default=func.now())

    
    # Relationships
    customer = relationship("Customer", back_populates="accounts")
    product = relationship("Product", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")


class Interaction(Base):
    __tablename__ = 'interaction'
    
    visit_id = Column(String, primary_key=True)
    customer_id = Column(String, ForeignKey('customer.customer_id'), nullable=False)
    visit_type = Column(String)
    visit_date = Column(DateTime, default=func.now())
    area_id = Column(String)
    area_view_open_time = Column(DateTime)
    area_view_close_time = Column(DateTime)
    
    # Relationships
    customer = relationship("Customer", back_populates="interactions")


class Transaction(Base):
    __tablename__ = 'transaction'
    
    transaction_id = Column(String, primary_key=True)
    account_id = Column(String, ForeignKey('account.account_id'), nullable=False)
    transaction_date = Column(DateTime, default=func.now())
    transaction_time = Column(DateTime, default=func.now())
    transaction_amount = Column(Float, nullable=False)
    payment_type = Column(String)
    transaction_category = Column(String)
    transaction_reference = Column(String)
    
    # Relationships
    account = relationship("Account", back_populates="transactions")