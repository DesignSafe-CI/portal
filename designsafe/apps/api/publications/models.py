from django.db import models

class PublicationSymlink(models.Model):
    tapis_accessor = models.CharField(max_length=512, primary_key=True)  # tapis://<system>/<path>
    type = models.CharField(max_length=4, choices=[('file', 'File'), ('dir', 'Directory')])

    def __str__(self):
        return f"{self.tapis_accessor} -> {self.type}"
