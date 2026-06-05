import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    engine = create_async_engine(
        'postgresql+asyncpg://neondb_owner:npg_j9rwPkAdtDY5@ep-withered-resonance-apsferh7-pooler.c-7.us-east-1.aws.neon.tech/neondb',
        connect_args={'ssl': True}
    )
    try:
        async with engine.connect() as conn:
            print("Connected successfully via asyncpg!")
    except Exception as e:
        print("Failed to connect:", e)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
