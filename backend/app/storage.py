import os
import shutil
from typing import BinaryIO

class LocalS3Storage:
    def __init__(self, bucket_name: str, base_dir: str = None):
        if base_dir is None:
            base_dir = os.path.join(os.path.dirname(__file__), "..", "local_s3")
        self._bucket_dir = os.path.join(base_dir, bucket_name)
        os.makedirs(self._bucket_dir, exist_ok=True)
        self._bucket_name = bucket_name
        self._base_dir = base_dir

    def put_object(self, file_obj: BinaryIO, object_name: str):
        """
        Mimics S3 put_object. Saves file_obj (a file-like object) to local bucket.
        """
        file_path = os.path.join(self._bucket_dir, object_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file_obj, buffer)

    async def upload_file(self, file, folder: str) -> str:
        import uuid
        ext = os.path.splitext(file.filename)[1]
        filename = f"{folder}/{uuid.uuid4()}{ext}"
        self.put_object(file.file, filename)
        return self.get_url(filename)

    def get_url(self, object_name: str) -> str:
        """
        Returns a URL path mimicking S3 URL structure.
        """
        return f"/uploads/{self._bucket_name}/{object_name}"

    def delete_object(self, object_name: str):
        """
        Mimics S3 delete_object. Removes file from local bucket.
        """
        file_path = os.path.join(self._bucket_dir, object_name)
        if os.path.exists(file_path):
            os.remove(file_path)

